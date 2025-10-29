#!/bin/bash

API_URL="https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"

echo "==========================================="
echo "🧪 Testing Receipt Creation with Range Allocation"
echo "==========================================="
echo "API URL: $API_URL"
echo ""

# First check which range is active
echo "0️⃣  Current active range:"
curl -s "$API_URL/ranges?status=active" | jq '.ranges[] | {rangeId, alias, year, next, end, remaining}'
echo ""
echo ""

# Test 1: Create a receipt (should use active range)
echo "1️⃣  Test: Create receipt with current date (should succeed)"
echo ""
curl -s -X POST "$API_URL/receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "donor": {
      "name": "Test Donor",
      "mobile": "+919876543210"
    },
    "breakup": {
      "TEMPLE_GENERAL": 1000
    },
    "payment": {
      "mode": "CASH"
    }
  }' | jq '.'
echo ""
echo ""

# Test 2: Create receipt with year mismatch (should fail in strict mode)
echo "2️⃣  Test: Create receipt with 2024 date (year mismatch, should FAIL)"
echo ""
curl -s -X POST "$API_URL/receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "donor": {
      "name": "Test Donor 2024",
      "mobile": "+919876543211"
    },
    "breakup": {
      "TEMPLE_GENERAL": 2000
    },
    "payment": {
      "mode": "CASH"
    },
    "date": "2024-12-31"
  }' | jq '.'
echo ""
echo ""

# Test 3: Create receipt with year mismatch in flexible mode (should succeed)
echo "3️⃣  Test: Create receipt with 2024 date + flexibleMode (should SUCCEED)"
echo ""
curl -s -X POST "$API_URL/receipts" \
  -H "Content-Type: application/json" \
  -d '{
    "donor": {
      "name": "Test Donor 2024 Flexible",
      "mobile": "+919876543212"
    },
    "breakup": {
      "TEMPLE_GENERAL": 3000
    },
    "payment": {
      "mode": "CASH"
    },
    "date": "2024-12-31",
    "flexibleMode": true
  }' | jq '.'
echo ""
echo ""

# Test 4: Check active range after allocations
echo "4️⃣  Check active range after allocations:"
curl -s "$API_URL/ranges?status=active" | jq '.ranges[] | {rangeId, alias, next, remaining}'
echo ""
echo ""

echo "==========================================="
echo "✅ Receipt creation tests completed!"
echo "==========================================="
