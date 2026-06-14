import csv
import re
from decimal import Decimal, InvalidOperation
from dateutil import parser as date_parser
from .models import StagedExpense

def clean_amount(raw_amount):
    """Strips commas and spaces, attempts to cast to Decimal."""
    if not raw_amount:
        return None
    cleaned = str(raw_amount).replace(',', '').strip()
    try:
        return Decimal(cleaned).quantize(Decimal('0.01'))
    except InvalidOperation:
        return None


def process_csv_import(file_obj):
    # Decode the uploaded file to string
    StagedExpense.objects.all().delete()
    decoded_file = file_obj.read().decode('utf-8').splitlines()
    reader = csv.DictReader(decoded_file)
    
    report = {
        "total_rows": 0,
        "staged": 0,
        "anomalies_detected": 0,
        "actions_taken": []
    }

    seen_signatures = set() # For duplicate detection within the file

    for row_num, row in enumerate(reader, start=2): # Start at 2 to account for headers
        report["total_rows"] += 1
        anomalies = []
        action_log = []

        # 1. Extract Raw Data safely
        raw_date = row.get('date', '').strip()
        desc = row.get('description', '').strip()
        payer = row.get('paid_by', '').strip()
        amount_str = row.get('amount', '').strip()
        currency = row.get('currency', '').strip()
        split_type = row.get('split_type', '').strip().upper()
        split_with = row.get('split_with', '').strip()
        
        # 2. Amount Validation & Cleaning
        amount = clean_amount(amount_str)
        if amount is None:
            anomalies.append("INVALID_AMOUNT_FORMAT")
        elif amount == 0:
            anomalies.append("ZERO_AMOUNT_DISCARDED")
            report["actions_taken"].append(f"Row {row_num}: Discarded '{desc}' because amount is 0.")
            continue # Skip saving entirely
        elif amount < 0:
            anomalies.append("NEGATIVE_AMOUNT_REFUND")
            action_log.append("Flagged as potential refund requiring reverse-split logic.")

        # 3. Missing Payer
        if not payer:
            anomalies.append("MISSING_PAYER")
            action_log.append("Suspended: Requires user to assign a payer.")

        # 4. Currency Fallback
        if not currency:
            currency = 'INR'
            anomalies.append("ASSUMED_CURRENCY")
            action_log.append("Currency missing. Defaulted to INR.")

        # 5. Settlement Detection
        if not split_type and amount and amount > 0 and ';' not in split_with:
            anomalies.append("POSSIBLE_SETTLEMENT")
            action_log.append("Flagged as a settlement (not a standard expense).")

        # 6. Duplicate Detection
        # Signature based on date, lowercase description, and amount
        signature = f"{raw_date}|{desc.lower()}|{amount_str}"
        if signature in seen_signatures:
            anomalies.append("DUPLICATE_DETECTED")
            action_log.append("Exact duplicate found. Flagged for review.")
        seen_signatures.add(signature)

        # 7. Percentage Math Validation
        if split_type == 'PERCENTAGE':
            details = row.get('split_details', '')
            try:
                # Extract all numbers from the string (e.g., "Aisha 30%; Rohan 30%")
                pcts = re.findall(r'(\d+(?:\.\d+)?)%', details)
                total_pct = sum(Decimal(p) for p in pcts)
                if total_pct != Decimal('100'):
                    anomalies.append("MATH_ERROR_PERCENTAGE")
                    action_log.append(f"Percentages add up to {total_pct}%, not 100%.")
            except Exception:
                anomalies.append("INVALID_SPLIT_DETAILS")

        # Compile anomalies for tracking
        if anomalies:
            report["anomalies_detected"] += 1
            report["actions_taken"].append(f"Row {row_num} ('{desc}'): " + " | ".join(action_log))

        # 8. Save to Quarantine (StagedExpense)
        StagedExpense.objects.create(
            raw_date=raw_date,
            raw_description=desc,
            raw_paid_by=payer,
            raw_amount=amount_str,
            raw_currency=currency,
            raw_split_type=split_type,
            raw_split_with=split_with,
            raw_split_details=row.get('split_details', ''),
            raw_notes=row.get('notes', ''),
            status='PENDING' if anomalies else 'RESOLVED',
            anomalies={"errors": anomalies}
        )
        report["staged"] += 1

    return report