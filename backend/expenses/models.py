from django.db import models
from django.contrib.auth.models import User

class Group(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class GroupMember(models.Model):
    """
    Temporal tracking: Solves Meera/Sam's request. We must know exactly 
    when someone lived in the flat to validate if they owe a bill.
    """
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    joined_date = models.DateField()
    left_date = models.DateField(null=True, blank=True) # Null means currently active

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

class Expense(models.Model):
    SPLIT_CHOICES = [
        ('EQUAL', 'Equal'),
        ('UNEQUAL', 'Unequal'),
        ('PERCENTAGE', 'Percentage'),
        ('SHARE', 'Share'),
    ]

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='expenses', null=True, blank=True)
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='paid_expenses')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR') # Solves Priya's USD/INR request
    description = models.CharField(max_length=255)
    split_type = models.CharField(max_length=15, choices=SPLIT_CHOICES, default='EQUAL')
    date = models.DateField() # The finalized, cleaned date
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description} ({self.amount} {self.currency})"

class ExpenseSplit(models.Model):
    expense = models.ForeignKey(Expense, on_delete=models.CASCADE, related_name='splits')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owed_splits')
    owed_amount = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.user.username} owes {self.owed_amount} for {self.expense.description}"

class Settlement(models.Model):
    payer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_made')
    payee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments_received')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='settlements', null=True, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    date = models.DateField()

    def __str__(self):
        return f"Settlement: {self.payer.username} paid {self.payee.username} {self.amount} {self.currency}"

# ==========================================
# THE STAGING AREA (CSV INGESTION PIPELINE)
# ==========================================

class StagedExpense(models.Model):
    """
    Acts as a quarantine zone for raw CSV rows. Everything is a CharField to prevent 
    the database from crashing if a date is formatted wrong or an amount is a string.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pending Review'),
        ('RESOLVED', 'Resolved & Imported'),
        ('REJECTED', 'Rejected / Deleted'),
    ]

    # Raw data exactly as it appears in the CSV
    raw_date = models.CharField(max_length=50, blank=True, null=True)
    raw_description = models.CharField(max_length=255, blank=True, null=True)
    raw_paid_by = models.CharField(max_length=255, blank=True, null=True)
    raw_amount = models.CharField(max_length=50, blank=True, null=True)
    raw_currency = models.CharField(max_length=10, blank=True, null=True)
    raw_split_type = models.CharField(max_length=50, blank=True, null=True)
    raw_split_with = models.TextField(blank=True, null=True)
    raw_split_details = models.TextField(blank=True, null=True)
    raw_notes = models.TextField(blank=True, null=True)

    # Ingestion tracking
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='PENDING')
    anomalies = models.JSONField(default=dict, blank=True) # e.g., {"errors": ["MISSING_PAYER", "BAD_MATH"]}
    imported_expense = models.ForeignKey(Expense, on_delete=models.SET_NULL, null=True, blank=True) # Link to final record if resolved
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Staged: {self.raw_description} (Status: {self.status})"