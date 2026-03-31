from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from OrderStatusTracking.models import Order
from Authentication.models import CustomUser as User
from inventory.models import Medicine
from Billing.models import Bill  # if you want to calculate sales from bills
from loyalty.models import LoyaltyAccount, CreditBill
from django.db.models import Count
from inventory.utils import check_seasonal_stock_levels

@api_view(['GET'])
def admin_dashboard_analytics(request):
    """
    Admin Dashboard Analytics
    """
    # Trigger seasonal stock checks
    check_seasonal_stock_levels()

    # Total Sales (From Bills)
    total_sales = Bill.objects.aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    # Total Orders
    total_orders = Order.objects.count()

    # Total Users
    total_users = User.objects.count()

    # Low Stock Count
    low_stock_count = Medicine.objects.filter(stock__lte=10).count()

    # Top Medicines (Based on Bills items JSON)
    top_medicines_data = []
    medicines = Medicine.objects.all()

    for med in medicines:
        total_sold = 0
        bills = Bill.objects.filter(items__contains=[{"name": med.name}])
        for bill in bills:
            for item in bill.items:
                if item.get("name") == med.name:
                    total_sold += int(item.get("qty", 0))

        top_medicines_data.append({
            "medicine__name": med.name,
            "total_sold": total_sold
        })

    top_medicines = sorted(
        top_medicines_data,
        key=lambda x: x["total_sold"],
        reverse=True
    )[:5]

    # Low Stock Items
    low_stock_items = Medicine.objects.filter(stock__lte=10).values(
        "name", "stock"
    )

    # Loyalty Analytics
    total_loyalty_accounts = LoyaltyAccount.objects.count()
    tier_distribution_qs = LoyaltyAccount.objects.values('tier').annotate(count=Count('tier'))
    tier_distribution = [{"name": item['tier'].capitalize(), "value": item['count']} for item in tier_distribution_qs]

    # Credit Bills Analytics
    unpaid_bills_qs = CreditBill.objects.filter(status='unpaid')
    total_unpaid_bills_amount = unpaid_bills_qs.aggregate(total=Sum('total_amount'))['total'] or 0
    total_unpaid_bills_count = unpaid_bills_qs.count()

    # Overdue Credit Notification
    from django.utils import timezone
    from notifications.services import notify_admins
    from notifications.models import Notification
    
    overdue_bills = unpaid_bills_qs.filter(due_date__lt=timezone.now())
    for bill in overdue_bills:
        msg = f"Credit Bill for {bill.user.email} (Amount: Rs {bill.total_amount:.2f}) is Overdue!"
        # Check if this specific notification already exists
        if not Notification.objects.filter(message=msg).exists():
            notify_admins(msg, notification_type="billing")

    return Response({
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_users": total_users,
        "low_stock_count": low_stock_count,
        "top_medicines": top_medicines,
        "low_stock_items": list(low_stock_items),
        "total_loyalty_accounts": total_loyalty_accounts,
        "loyalty_tier_distribution": tier_distribution,
        "total_unpaid_bills_amount": total_unpaid_bills_amount,
        "total_unpaid_bills_count": total_unpaid_bills_count
    })