#!/bin/bash

API_URL="https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"

echo "==========================================="
echo "🧪 Testing Receipt Listing & Search APIs"
echo "==========================================="
echo "API URL: $API_URL"
echo ""

# Test 1: List today's receipts (default)
echo "1️⃣  Test: List receipts (today by default)"
echo ""
curl -s "$API_URL/receipts" | jq '.'
echo ""
echo ""

# Test 2: List receipts for specific date
echo "2️⃣  Test: List receipts for 2025-10-28"
echo ""
curl -s "$API_URL/receipts?date=2025-10-28" | jq '.'
echo ""
echo ""

# Test 3: List receipts by date range
echo "3️⃣  Test: List receipts by date range (2025-10-01 to 2025-10-28)"
echo ""
curl -s "$API_URL/receipts?startDate=2025-10-01&endDate=2025-10-28" | jq '.items[] | {receiptNo, date, donor: .donor.name, total}'
echo ""
echo ""

# Test 4: Get receipt by number
echo "4️⃣  Test: Get specific receipt by number (2025-20001)"
echo ""
curl -s "$API_URL/receipts?receiptNo=2025-20001" | jq '.'
echo ""
echo ""

# Test 5: List receipts from specific range
echo "5️⃣  Test: List receipts from range 2025-H"
echo ""
curl -s "$API_URL/receipts?rangeId=2025-H" | jq '.items[] | {receiptNo, rangeId, total}'
echo ""
echo ""

# Test 6: Search donor by phone number
echo "6️⃣  Test: Search donor by phone (+919876543210)"
echo ""
curl -s "$API_URL/receipts/search?donor=%2B919876543210&type=phone" | jq '.'
echo ""
echo ""

# Test 7: Search donor by phone (auto-detect type)
echo "7️⃣  Test: Search donor by phone (auto-detect)"
echo ""
curl -s "$API_URL/receipts/search?donor=9876543210" | jq '.'
echo ""
echo ""

# Test 8: List receipts for a specific donor (using donorId from previous response)
# Note: You'll need to replace D_9060a3eb27cb with actual donor ID from your data
echo "8️⃣  Test: List receipts for specific donor ID"
echo ""
DONOR_ID="D_9060a3eb27cb"
curl -s "$API_URL/receipts/donor/$DONOR_ID" | jq '.items[] | {receiptNo, date, total}'
echo ""
echo ""

# Test 9: List receipts with pagination (limit=2)
echo "9️⃣  Test: List receipts with pagination (limit=2)"
echo ""
curl -s "$API_URL/receipts?limit=2" | jq '{count, nextToken, items: .items[] | {receiptNo, total}}'
echo ""
echo ""

# Test 10: List receipts filtered by donorId query param
echo "🔟 Test: List receipts by donorId query param"
echo ""
curl -s "$API_URL/receipts?donorId=$DONOR_ID&limit=3" | jq '.items[] | {receiptNo, date, total}'
echo ""
echo ""

echo "==========================================="
echo "✅ Receipt listing tests completed!"
echo "==========================================="
