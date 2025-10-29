#!/bin/bash

API_URL="https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"

echo "========================================="
echo "🧪 Testing Range Validation Rules"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Test 1: Try to create an overlapping range (should fail)
echo "1️⃣  Test: Create overlapping range (1-3000) - should FAIL"
echo "   Existing: 2025-A (1-9999, active)"
echo "   New: 2025-C (1-3000)"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "OVERLAP-TEST-2025-C",
    "year": 2025,
    "start": 1,
    "end": 3000,
    "suffix": "C",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 2: Try to create another overlapping range (should fail)
echo "2️⃣  Test: Create overlapping range (5500-6500) - should FAIL"
echo "   Existing: 2025-B (5001-6000, draft)"
echo "   New: 2025-D (5500-6500)"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "OVERLAP-TEST-2025-D",
    "year": 2025,
    "start": 5500,
    "end": 6500,
    "suffix": "D",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 3: Create non-overlapping range (should succeed)
echo "3️⃣  Test: Create non-overlapping range (10000-19999) - should SUCCEED"
echo ""
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "NON-OVERLAP-2025-E",
    "year": 2025,
    "start": 10000,
    "end": 19999,
    "suffix": "E",
    "createdBy": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 4: Try to activate 2025-B when 2025-A is already active (should fail)
echo "4️⃣  Test: Activate 2025-B when 2025-A is active - should FAIL"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-B/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 5: Lock the active range first
echo "5️⃣  Test: Lock active range 2025-A - should SUCCEED"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-A/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lock",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 6: Now activate 2025-B (should succeed since 2025-A is locked)
echo "6️⃣  Test: Activate 2025-B after locking 2025-A - should SUCCEED"
echo ""
curl -s -X PUT "$API_URL/ranges/2025-B/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userId": "test-user"
  }' | jq '.'
echo ""
echo ""

# Test 7: Verify only one active range
echo "7️⃣  Test: List active ranges - should show only 2025-B"
echo ""
curl -s "$API_URL/ranges?status=active" | jq '.'
echo ""
echo ""

echo "========================================="
echo "✅ Validation tests completed!"
echo "========================================="
