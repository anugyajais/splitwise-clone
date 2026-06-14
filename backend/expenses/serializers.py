from .models import StagedExpense
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Group, GroupMember, Expense, ExpenseSplit, Settlement

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class GroupMemberSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = GroupMember
        fields = ['id', 'user', 'joined_at']

class GroupSerializer(serializers.ModelSerializer):
    members = GroupMemberSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'created_by', 'created_at', 'members']

class ExpenseSplitSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )

    class Meta:
        model = ExpenseSplit
        fields = ['id', 'user', 'user_id', 'owed_amount']

class ExpenseSerializer(serializers.ModelSerializer):
    splits = ExpenseSplitSerializer(many=True, read_only=True)
    payer = UserSerializer(read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'group', 'payer', 'amount', 'description', 'split_type', 'created_at', 'splits']

class SettlementSerializer(serializers.ModelSerializer):
    payer = UserSerializer(read_only=True)
    payee = UserSerializer(read_only=True)

    class Meta:
        model = Settlement
        fields = ['id', 'payer', 'payee', 'group', 'amount', 'settled_at']


class StagedExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = StagedExpense
        fields = '__all__'