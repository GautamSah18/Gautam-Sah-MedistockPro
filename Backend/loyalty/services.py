from decimal import Decimal
from django.utils import timezone
from .models import LoyaltyAccount, LoyaltyTransaction, CreditBill

def get_or_create_loyalty_account(user):
    account, created = LoyaltyAccount.objects.get_or_create(user=user)
    return account

def process_credit_purchase(user, total_amount):
    """
    Called when a credit bill is created.
    1 point = Rs 100 purchase value.
    """
    # Create Credit bill
    credit_bill = CreditBill.objects.create(
        user=user,
        total_amount=total_amount,
        status='unpaid'
    )

    points_earned = int(total_amount // 100)

    if points_earned > 0:
        account = get_or_create_loyalty_account(user)
        account.total_points += points_earned
        account.update_tier() # Calculates and saves the tier
        account.save()
        
        LoyaltyTransaction.objects.create(
            user=user,
            points=points_earned,
            reason='purchase'
        )
        
    return credit_bill


def process_credit_payment(credit_bill_id):
    """
    Called when a credit bill is paid.
    Checks duration, rewards or penalizes.
    """
    try:
        bill = CreditBill.objects.get(id=credit_bill_id, status='unpaid')
    except CreditBill.DoesNotExist:
        return False, "Bill not found or already paid"

    bill.payment_date = timezone.now()
    bill.status = 'paid'
    bill.save()

    days_taken = (bill.payment_date - bill.purchase_date).days

    account = get_or_create_loyalty_account(bill.user)

    if days_taken <= 60:
        # Add +50 bonus loyalty points
        bonus_points = 50
        account.total_points += bonus_points
        account.update_tier()
        account.save()
        
        LoyaltyTransaction.objects.create(
            user=bill.user,
            points=bonus_points,
            reason='early_credit_payment'
        )
        return True, "Paid within 60 days. Bonus points awarded."
    else:
        account.tier = 'regular'
        account.save()
        
        LoyaltyTransaction.objects.create(
            user=bill.user,
            points=0,
            reason='late_payment_penalty'
        )
        return True, "Paid after 60 days. Tier downgraded to Regular."

