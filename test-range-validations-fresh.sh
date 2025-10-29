#!/bin/bash

API_URL="https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"

echo "==========================================="
echo "🧪 Testing Range Validation Rules (Fresh)"
echo "==========================================="
echo "API URL: $API_URL"
echo ""

# First, check current state
echo "0️⃣  Current state - List all ranges:"
curl -s "$API_URL/ranges" | jq '.ranges[] | {rangeId, alias, start, end, status}'
echo ""
echo ""

# Test 1: Try to create an overlapping range with 2025-A (1-9999)
echo "1️⃣  Test: Create overlapping range (500-1500) with 2025-A (1-9999) - should FAIL"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "OVERLAP-WITH-A",
    "year": 2025,
    "start": 500,
    "end": 1500,
    "suffix": "F",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 2: Try to create another overlapping range with 2025-B (5001-6000)
echo "2️⃣  Test: Create overlapping range (5500-6500) with 2025-B (5001-6000) - should FAIL"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "OVERLAP-WITH-B",
    "year": 2025,
    "start": 5500,
    "end": 6500,
    "suffix": "G",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 3: Create non-overlapping range (should succeed)
echo "3️⃣  Test: Create non-overlapping range (20000-29999) - should SUCCEED"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "NON-OVERLAP-2025-H",
    "year": 2025,
    "start": 20000,
    "end": 29999,
    "suffix": "H",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 4: Try to activate 2025-H when 2025-B is already active (should fail)
echo "4️⃣  Test: Activate 2025-H when 2025-B is active - should FAIL"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-H/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 5: Lock the active range 2025-B first
echo "5️⃣  Test: Lock active range 2025-B - should SUCCEED"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-B/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lock",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 6: Now activate 2025-H (should succeed since 2025-B is locked)
echo "6️⃣  Test: Activate 2025-H after locking 2025-B - should SUCCEED"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-H/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 7: Verify only one active range
echo "7️⃣  Test: List active ranges - should show only 2025-H"
echo ""
curl -s "$API_URL/ranges?status=active" | jq '.ranges[] | {rangeId, alias, status}'
echo ""
echo ""

echo "==========================================="
echo "✅ Validation tests completed!"
echo "==========================================="
