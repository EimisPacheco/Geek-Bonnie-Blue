#!/bin/bash

# FlightRiskRadar Environment Validation Script
# This script checks if all required environment variables are set

echo "🔍 FlightRiskRadar Environment Validation"
echo "=========================================="

# Load environment variables from .env.local if it exists
if [ -f ".env.local" ]; then
    echo "📄 Loading environment variables from .env.local..."
    export $(cat .env.local | grep -v '^#' | xargs)
elif [ -f ".env" ]; then
    echo "📄 Loading environment variables from .env..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ No .env file found! Please run ./setup-env.sh first."
    exit 1
fi

echo ""
echo "🔑 Checking required environment variables..."

# List of required environment variables
required_vars=(
    "VITE_SERPAPI_KEY"
    "SERPAPI_API_KEY"
    "GOOGLE_API_KEY"
    "VITE_GOOGLE_API_KEY"
    "GOOGLE_CLOUD_PROJECT"
    "VITE_CLOUD_FUNCTION_URL"
)

# Optional environment variables
optional_vars=(
    "GOOGLE_CLOUD_LOCATION"
)

all_good=true

# Check required variables
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var is not set"
        all_good=false
    else
        # Show first 10 characters of the key for verification
        key_preview="${!var:0:10}..."
        echo "✅ $var: $key_preview"
    fi
done

# Check optional variables
echo ""
echo "🔧 Optional environment variables:"
for var in "${optional_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "⚠️  $var is not set (optional)"
    else
        key_preview="${!var:0:10}..."
        echo "✅ $var: $key_preview"
    fi
done

echo ""
if [ "$all_good" = true ]; then
    echo "🎉 All required environment variables are set!"
    echo "🚀 You can now run: npm run dev"
else
    echo "❌ Some required environment variables are missing."
    echo "📝 Please edit .env.local and add the missing keys."
    echo "🔗 See README.md for instructions on getting API keys."
    exit 1
fi 