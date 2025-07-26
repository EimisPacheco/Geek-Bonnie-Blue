#!/bin/bash

# FlightRiskRadar Environment Setup Script
# This script helps you set up your environment variables

echo "🚀 FlightRiskRadar Environment Setup"
echo "======================================"

# Check if env.example exists
if [ ! -f "env.example" ]; then
    echo "❌ env.example file not found!"
    exit 1
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "📄 Creating .env.local from env.example..."
    cp env.example .env.local
    echo "✅ .env.local created successfully!"
else
    echo "⚠️  .env.local already exists. Skipping creation."
fi

echo ""
echo "🔑 Please edit .env.local and add your API keys:"
echo ""
echo "Required API Keys:"
echo "- SerpAPI Key: https://serpapi.com"
echo "- Google Gemini API Key: https://makersuite.google.com/app/apikey"
echo "- Google Translate API Key: https://console.cloud.google.com/apis/credentials"
echo "- Google Cloud Project ID: https://console.cloud.google.com"
echo ""
echo "📝 Edit .env.local now:"
echo "   nano .env.local"
echo "   # or"
echo "   code .env.local"
echo ""
echo "🏃 After setting up your keys, run:"
echo "   npm install"
echo "   npm run dev"
echo ""
echo "📚 For more information, see README.md" 