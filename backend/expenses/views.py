from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.response import Response
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from .models import Group, Expense, ExpenseSplit, Settlement
from .serializers import UserSerializer, GroupSerializer, ExpenseSerializer, SettlementSerializer
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from .services import process_csv_import
from rest_framework.permissions import AllowAny
from rest_framework.decorators import permission_classes

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        # Automatically set the user creating the group as the 'created_by' user
        serializer.save(created_by=self.request.user)



class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        # 1. Extract the nested split data from the frontend payload
        splits_data = request.data.pop('splits', [])
        
        # 2. Validate and save the main Expense record
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save(payer=request.user)

        split_type = expense.split_type
        total_amount = Decimal(str(expense.amount))
        
        split_instances = []

        # 3. Handle the Math based on Split Type
        if split_type == 'EQUAL':
            # Frontend just sends a list of user_ids involved
            num_users = len(splits_data)
            if num_users > 0:
                # Round to 2 decimal places
                split_amount = round(total_amount / num_users, 2) 
                
                # Handle the "penny drop" (e.g., $100 / 3 = $33.33... leaves $0.01)
                # For a 2-day MVP, we'll just let the payer absorb the 1 cent difference.
                for split in splits_data:
                    user_id = split.get('user_id')
                    split_instances.append(ExpenseSplit(
                        expense=expense, 
                        user_id=user_id, 
                        owed_amount=split_amount
                    ))
                    
        elif split_type == 'UNEQUAL':
            # Frontend sends explicit amounts for each user
            calculated_total = sum(Decimal(str(s.get('owed_amount', 0))) for s in splits_data)
            if calculated_total != total_amount:
                # Rollback transaction if math doesn't match
                return Response(
                    {"error": "Unequal splits must exactly equal the total amount."}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            for split in splits_data:
                split_instances.append(ExpenseSplit(
                    expense=expense, 
                    user_id=split.get('user_id'), 
                    owed_amount=Decimal(str(split.get('owed_amount')))
                ))

        elif split_type == 'PERCENTAGE':
            # Frontend sends percentages (e.g., 60, 40)
            calculated_pct = sum(Decimal(str(s.get('percentage', 0))) for s in splits_data)
            if calculated_pct != Decimal('100'):
                return Response({"error": "Percentages must add up to 100."}, status=status.HTTP_400_BAD_REQUEST)
                
            for split in splits_data:
                pct = Decimal(str(split.get('percentage')))
                amount = round((pct / Decimal('100')) * total_amount, 2)
                split_instances.append(ExpenseSplit(
                    expense=expense, 
                    user_id=split.get('user_id'), 
                    owed_amount=amount
                ))

        elif split_type == 'SHARE':
            # Frontend sends integer shares (e.g., User A gets 2 shares, User B gets 1)
            total_shares = sum(Decimal(str(s.get('share', 0))) for s in splits_data)
            for split in splits_data:
                share = Decimal(str(split.get('share')))
                amount = round((share / total_shares) * total_amount, 2)
                split_instances.append(ExpenseSplit(
                    expense=expense, 
                    user_id=split.get('user_id'), 
                    owed_amount=amount
                ))

        # 4. Bulk insert all the calculated splits into the database
        if split_instances:
            ExpenseSplit.objects.bulk_create(split_instances)
        
        headers = self.get_success_headers(serializer.data)
        # Re-fetch the expense to include the newly created splits in the response
        response_serializer = self.get_serializer(expense)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class SettlementViewSet(viewsets.ModelViewSet):
    queryset = Settlement.objects.all()
    serializer_class = SettlementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(payer=self.request.user)


@api_view(['POST'])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser])
def upload_csv(request):
    """
    Endpoint for uploading expenses_export.csv.
    Processes the file, stages the data, and returns the required Import Report.
    """
    if 'file' not in request.FILES:
        return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)
        
    csv_file = request.FILES['file']
    
    if not csv_file.name.endswith('.csv'):
        return Response({"error": "File must be a CSV."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Run our engine
        report = process_csv_import(csv_file)
        return Response(report, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from rest_framework.decorators import action
from .models import StagedExpense
from .serializers import StagedExpenseSerializer
from decimal import Decimal
from rest_framework.permissions import AllowAny

class StagedExpenseViewSet(viewsets.ModelViewSet):
    queryset = StagedExpense.objects.all()
    serializer_class = StagedExpenseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = super().get_queryset()

        status_param = self.request.query_params.get('status')
        print("STATUS PARAM:", status_param)

        if status_param:
            queryset = queryset.filter(status=status_param)

        print("COUNT:", queryset.count())

        return queryset