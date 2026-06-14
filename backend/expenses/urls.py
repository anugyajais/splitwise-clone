from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet,
    GroupViewSet,
    ExpenseViewSet,
    SettlementViewSet,
    StagedExpenseViewSet,
    upload_csv,
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'groups', GroupViewSet)
router.register(r'expenses', ExpenseViewSet)
router.register(r'settlements', SettlementViewSet)
router.register(r'staged-expenses', StagedExpenseViewSet)

urlpatterns = [
    path('upload-csv/', upload_csv, name='upload-csv'),
    path('import/', upload_csv, name='upload_csv'),
    path('', include(router.urls)),
]