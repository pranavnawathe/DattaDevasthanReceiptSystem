#!/bin/bash

# Temple Receipt System - Complete Deployment Script
# This script builds the UI and deploys everything via CDK

set -e  # Exit on error

echo "🏗️  Temple Receipt System Deployment"
echo "===================================="
echo ""

# Step 1: Build UI
echo "📦 Step 1/2: Building UI..."
cd ui
npm run build
cd ..
echo "✅ UI built successfully"
echo ""

# Step 2: Deploy all stacks via CDK
echo "☁️  Step 2/2: Deploying to AWS via CDK..."
cd TempleReceiptSystem/TempleReceiptSystemCDK
npx cdk deploy --all --require-approval never --profile temple-admin
cd ../..
echo "✅ Deployment complete!"
echo ""

# Show deployed URLs
echo "🎉 Deployment Summary:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend:  http://datta-devasthan-receipts.s3-website.ap-south-1.amazonaws.com"
echo "Backend:   https://lfg5incxn1.execute-api.ap-south-1.amazonaws.com"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
