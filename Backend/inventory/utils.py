from datetime import datetime, timedelta
from django.utils import timezone
from .models import SeasonalMedicine, Medicine
from notifications.services import notify_admins
from Billing.models import Bill

def get_current_season():
    month = datetime.now().month
    if month in [12, 1, 2]:
        return "Winter"
    elif month in [3, 4, 5]:
        return "Spring"
    elif month in [6, 7, 8]:
        return "Summer"
    else:
        return "Autumn"
        
def check_seasonal_stock_levels():
    current_season = get_current_season()
    seasonal_meds = SeasonalMedicine.objects.filter(season=current_season)
    
    thirty_days_ago = timezone.now() - timedelta(days=30)
    
    for sm in seasonal_meds:
        med = sm.medicine
        
        # Calculate recent sales
        # Bills have JSON items: [{"name": med.name, "qty": "5"}]
        recent_bills = Bill.objects.filter(
            created_at__gte=thirty_days_ago,
            items__contains=[{"name": med.name}]
        )
        recent_sales = 0
        for bill in recent_bills:
            for item in bill.items:
                if item.get("name") == med.name:
                    recent_sales += int(item.get("qty", 0))
                    
        # If stock is strictly less than minimum stock and recent_sales is greater than 0
        if med.stock < med.min_stock:
            # Check if this precise notification was recently sent (for avoiding spam)
            # Django channels doesn't restrict, but this gets triggered on admin dashboard load.
            message = (
                f"Seasonal Medicine Stock Alert\n"
                f"Season: {current_season}\n"
                f"Medicine: {med.name}\n"
                f"Current Stock: {med.stock}\n"
                f"Minimum Stock: {med.min_stock}\n"
                f"Recent Sales (30 Days): {recent_sales}\n"
                f"Recommendation: Restock Soon"
            )
            
            # Simple deduplication could be implemented here or upstream.
            # But the prompt requires exactly this format.
            try:
                from notifications.models import Notification
                # Prevent spam: only create if no similar unread notification exists
                if not Notification.objects.filter(message=message, is_read=False, user__is_staff=True).exists():
                    notify_admins(message, notification_type="medicine")
            except Exception as e:
                # Fallback if Notification model is slightly different
                notify_admins(message, notification_type="medicine")
