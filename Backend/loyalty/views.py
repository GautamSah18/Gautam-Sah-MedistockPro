from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LoyaltyAccount, LoyaltyTransaction, CreditBill
from .serializers import LoyaltyAccountSerializer, LoyaltyTransactionSerializer, CreditBillSerializer
from .services import get_or_create_loyalty_account, process_credit_payment

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_loyalty_dashboard(request):
    """
    Get customer loyalty details: points, tier, next tier progress, credit status.
    """
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access their loyalty dashboard'}, status=status.HTTP_403_FORBIDDEN)

    account = get_or_create_loyalty_account(request.user)
    

    tier_thresholds = [
        ('regular', 0),
        ('bronze', 500),
        ('silver', 2000),
        ('gold', 5000),
        ('diamond', 10000),
    ]
    
    next_tier = None
    next_tier_points = 0
    
    for i in range(len(tier_thresholds)):
        if account.total_points < tier_thresholds[i][1]:
            next_tier = tier_thresholds[i][0]
            next_tier_points = tier_thresholds[i][1]
            break

    if next_tier is None:
        next_tier = 'diamond'
        next_tier_points = 10000
    

    unpaid_bills = CreditBill.objects.filter(user=request.user, status='unpaid')
    total_credit = sum([bill.total_amount for bill in unpaid_bills])

    data = {
        'account': LoyaltyAccountSerializer(account).data,
        'next_tier': next_tier,
        'next_tier_points': next_tier_points,
        'unpaid_credit_total': total_credit,
        'unpaid_bills_count': unpaid_bills.count()
    }

    return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_loyalty_transactions(request):
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access'}, status=status.HTTP_403_FORBIDDEN)
    
    transactions = LoyaltyTransaction.objects.filter(user=request.user).order_by('-created_at')
    serializer = LoyaltyTransactionSerializer(transactions, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def customer_credit_bills(request):
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access'}, status=status.HTTP_403_FORBIDDEN)

    bills = CreditBill.objects.filter(user=request.user).order_by('-purchase_date')
    serializer = CreditBillSerializer(bills, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_credit_bill(request, bill_id):
    if request.user.role != 'customer':
        return Response({'error': 'Only customers can access'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        bill = CreditBill.objects.get(id=bill_id, user=request.user, status='unpaid')
    except CreditBill.DoesNotExist:
        return Response({'error': 'Credit bill not found or already paid'}, status=status.HTTP_404_NOT_FOUND)
    
    success, message = process_credit_payment(bill.id)
    
    if success:
        return Response({'message': message}, status=status.HTTP_200_OK)
    else:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

# Admin endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_loyalty_accounts(request):
    if request.user.role != 'admin':
        return Response({'error': 'Only admin can access'}, status=status.HTTP_403_FORBIDDEN)
    
    accounts = LoyaltyAccount.objects.all().order_by('-total_points')
    serializer = LoyaltyAccountSerializer(accounts, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_all_credit_bills(request):
    if request.user.role != 'admin':
        return Response({'error': 'Only admin can access'}, status=status.HTTP_403_FORBIDDEN)

    bills = CreditBill.objects.all().order_by('-purchase_date')
    serializer = CreditBillSerializer(bills, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_pay_credit_bill(request, bill_id):
    if request.user.role != 'admin':
        return Response({'error': 'Only admin can access'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        bill = CreditBill.objects.get(id=bill_id, status='unpaid')
    except CreditBill.DoesNotExist:
        return Response({'error': 'Credit bill not found or already paid'}, status=status.HTTP_404_NOT_FOUND)
    
    success, message = process_credit_payment(bill.id)
    
    if success:
        return Response({'message': message}, status=status.HTTP_200_OK)
    else:
        return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

