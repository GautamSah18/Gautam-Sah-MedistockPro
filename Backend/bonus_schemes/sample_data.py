from django.utils import timezone
from datetime import timedelta
from inventory.models import Medicine
from bonus_schemes.models import Bonus, Gift, BillScheme

def create_sample_data():
    """Create sample bonuses, gifts, and schemes for testing"""
    
    # Create sample gifts
    gifts_data = [
        {
            'name': 'Premium Dinner Set',
            'description': 'Complete 12-piece dinner set with plates, bowls, and cutlery',
            'value': 2500.00,
            'image_url': 'https://example.com/dinner-set.jpg'
        },
        {
            'name': 'Luxury Bed Sheet Set',
            'description': '4-piece cotton bed sheet set with pillow covers',
            'value': 1800.00,
            'image_url': 'https://example.com/bed-sheet.jpg'
        },
        {
            'name': 'Digital Rice Cooker',
            'description': '5-liter automatic rice cooker with steam function',
            'value': 3500.00,
            'image_url': 'https://example.com/rice-cooker.jpg'
        },
        {
            'name': 'Kitchen Mixer Grinder',
            'description': '750W mixer grinder with 3 jars',
            'value': 2200.00,
            'image_url': 'https://example.com/mixer-grinder.jpg'
        },
        {
            'name': 'Electric Kettle',
            'description': '1.5L stainless steel electric kettle',
            'value': 1200.00,
            'image_url': 'https://example.com/kettle.jpg'
        },
        {
            'name': 'Toaster Oven',
            'description': '25L convection toaster oven',
            'value': 2800.00,
            'image_url': 'https://example.com/toaster-oven.jpg'
        }
    ]
    
    gifts = []
    for gift_data in gifts_data:
        gift, created = Gift.objects.get_or_create(**gift_data)
        gifts.append(gift)
        if created:
            print(f"Created gift: {gift}")
    
    # Create sample bonuses (assuming medicines exist)
    try:
        # Get some sample medicines
        medicines = Medicine.objects.filter(is_active=True)[:3]
        
        if medicines:
            bonus_data = [
                {
                    'name': 'Buy 10 Get 2 Free - Syrup Special',
                    'medicine': medicines[0],
                    'buy_quantity': 10,
                    'free_quantity': 2,
                    'start_date': timezone.now() - timedelta(days=1),
                    'end_date': timezone.now() + timedelta(days=30),
                    'is_active': True
                },
                {
                    'name': 'Buy 5 Get 1 Free - Tablet Deal',
                    'medicine': medicines[1] if len(medicines) > 1 else medicines[0],
                    'buy_quantity': 5,
                    'free_quantity': 1,
                    'start_date': timezone.now() - timedelta(days=1),
                    'end_date': timezone.now() + timedelta(days=45),
                    'is_active': True
                },
                {
                    'name': 'Buy 3 Get 1 Free - Capsule Offer',
                    'medicine': medicines[2] if len(medicines) > 2 else medicines[0],
                    'buy_quantity': 3,
                    'free_quantity': 1,
                    'start_date': timezone.now() - timedelta(days=1),
                    'end_date': timezone.now() + timedelta(days=60),
                    'is_active': True
                }
            ]
            
            for bonus_datum in bonus_data:
                bonus, created = Bonus.objects.get_or_create(**bonus_datum)
                if created:
                    print(f"Created bonus: {bonus}")
        else:
            print("No medicines found. Please add some medicines first.")
    
    except Exception as e:
        print(f"Error creating bonuses: {e}")
    
    # Create sample bill schemes
    scheme_data = [
        {
            'name': 'Gold Customer Scheme',
            'description': 'For bills Rs 1,00,000 and above',
            'min_bill_amount': 100000.00,
            'gift_value_limit': 10000.00,
            'start_date': timezone.now() - timedelta(days=1),
            'end_date': timezone.now() + timedelta(days=90),
            'is_active': True
        },
        {
            'name': 'Silver Customer Scheme',
            'description': 'For bills Rs 50,000 and above',
            'min_bill_amount': 50000.00,
            'gift_value_limit': 5000.00,
            'start_date': timezone.now() - timedelta(days=1),
            'end_date': timezone.now() + timedelta(days=90),
            'is_active': True
        },
        {
            'name': 'Platinum Customer Scheme',
            'description': 'For bills Rs 2,00,000 and above',
            'min_bill_amount': 200000.00,
            'gift_value_limit': 20000.00,
            'start_date': timezone.now() - timedelta(days=1),
            'end_date': timezone.now() + timedelta(days=90),
            'is_active': True
        }
    ]
    
    schemes = []
    for scheme_datum in scheme_data:
        scheme, created = BillScheme.objects.get_or_create(**scheme_datum)
        schemes.append(scheme)
        if created:
            print(f"Created scheme: {scheme}")
    
    # Associate gifts with schemes
    if schemes:
        # Gold scheme gets all gifts
        schemes[0].gifts.set(gifts)
        print(f"Associated {len(gifts)} gifts with {schemes[0].name}")
        
        # Silver scheme gets first 3 gifts
        schemes[1].gifts.set(gifts[:3])
        print(f"Associated {len(gifts[:3])} gifts with {schemes[1].name}")
        
        # Platinum scheme gets all gifts
        schemes[2].gifts.set(gifts)
        print(f"Associated {len(gifts)} gifts with {schemes[2].name}")

if __name__ == '__main__':
    create_sample_data()
