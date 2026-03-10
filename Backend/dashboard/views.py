from django.db.models import Sum
from rest_framework.decorators import api_view
from rest_framework.response import Response

from OrderStatusTracking.models import Order
from Authentication.models import CustomUser as User
from inventory.models import Medicine
from Billing.models import Bill  # if you want to calculate sales from bills


@api_view(['GET'])
def admin_dashboard_analytics(request):
    """
    Admin Dashboard Analytics
    """

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

    return Response({
        "total_sales": total_sales,
        "total_orders": total_orders,
        "total_users": total_users,
        "low_stock_count": low_stock_count,
        "top_medicines": top_medicines,
        "low_stock_items": list(low_stock_items)
    })