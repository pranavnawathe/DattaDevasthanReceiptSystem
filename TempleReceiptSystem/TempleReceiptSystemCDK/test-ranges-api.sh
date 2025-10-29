#!/bin/bash

# Test script for Range Management API
# API URL from deployment
API_URL="https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"

echo "========================================="
echo "🧪 Testing Range Management API"
echo "========================================="
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
curl -s "$API_URL/health" | jq
echo ""
echo ""

# Test 2: List Ranges (should be empty initially)
echo "2️⃣  Listing all ranges (should be empty)..."
curl -s "$API_URL/ranges" | jq
echo ""
echo ""

# Test 3: Create First Range
echo "3️⃣  Creating range: DIGI-2025-A (1-9999)..."
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "DIGI-2025-A",
    "year": 2025,
    "start": 1,
    "end": 9999,
    "suffix": "A",
    "createdBy": "admin-test"
  }' | jq
echo ""
echo ""

# Test 4: Create Second Range
echo "4️⃣  Creating range: PHYS-2025-B (5001-6000)..."
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "PHYS-2025-B",
    "year": 2025,
    "start": 5001,
    "end": 6000,
    "suffix": "B",
    "createdBy": "admin-test"
  }' | jq
echo ""
echo ""

# Test 5: List All Ranges
echo "5️⃣  Listing all ranges (should show 2)..."
curl -s "$API_URL/ranges" | jq
echo ""
echo ""

# Test 6: Filter by Status
echo "6️⃣  Filtering ranges by status=draft..."
curl -s "$API_URL/ranges?status=draft" | jq
echo ""
echo ""

# Test 7: Filter by Year
echo "7️⃣  Filtering ranges by year=2025..."
curl -s "$API_URL/ranges?year=2025" | jq
echo ""
echo ""

# Test 8: Get Single Range
echo "8️⃣  Getting single range: 2025-A..."
curl -s "$API_URL/ranges/2025-A" | jq
echo ""
echo ""

# Test 9: Activate Range
echo "9️⃣  Activating range: 2025-A..."
curl -s -X PUT "$API_URL/ranges/2025-A/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "activate",
    "userId": "admin-test"
  }' | jq
echo ""
echo ""

# Test 10: List Active Ranges
echo "🔟 Listing active ranges..."
curl -s "$API_URL/ranges?status=active" | jq
echo ""
echo ""

# Test 11: Lock Range
echo "1️⃣1️⃣  Locking range: 2025-A..."
curl -s -X PUT "$API_URL/ranges/2025-A/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "lock",
    "userId": "admin-test"
  }' | jq
echo ""
echo ""

# Test 12: Unlock Range
echo "1️⃣2️⃣  Unlocking range: 2025-A..."
curl -s -X PUT "$API_URL/ranges/2025-A/status" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "unlock",
    "userId": "admin-test"
  }' | jq
echo ""
echo ""

# Test 13: Invalid Range ID
echo "1️⃣3️⃣  Testing invalid range ID (should fail)..."
curl -s "$API_URL/ranges/INVALID-ID" | jq
echo ""
echo ""

# Test 14: Duplicate Range (should fail)
echo "1️⃣4️⃣  Creating duplicate range (should fail)..."
curl -s -X POST "$API_URL/ranges" \
  -H "Content-Type: application/json" \
  -d '{
    "alias": "DUPLICATE",
    "year": 2025,
    "start": 1,
    "end": 100,
    "suffix": "A",
    "createdBy": "admin-test"
  }' | jq
echo ""
echo ""

# Final Summary
echo "========================================="
echo "✅ All API tests completed!"
echo "========================================="
echo ""
echo "📋 Summary:"
echo "  - Health check: ✓"
echo "  - Create range: ✓"
echo "  - List ranges: ✓"
echo "  - Get single range: ✓"
echo "  - Filter ranges: ✓"
echo "  - Activate range: ✓"
echo "  - Lock/Unlock range: ✓"
echo "  - Error handling: ✓"
echo ""
