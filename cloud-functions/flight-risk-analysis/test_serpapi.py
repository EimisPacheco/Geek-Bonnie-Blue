#!/usr/bin/env python3
"""
Test SERPAPI directly from cloud environment
"""
import os
import requests
import json

def test_serpapi_direct():
    """Test SERPAPI call directly"""
    api_key = "e69a3bcabd329f1ccd4c756ec15ad28bf6c1e20f726fdf15c66366522229e1e7"
    
    print("🚨" * 50)
    print("TESTING SERPAPI DIRECTLY FROM CLOUD ENVIRONMENT")
    print(f"API Key present: {bool(api_key)}")
    print("🚨" * 50)
    
    try:
        url = "https://serpapi.com/search"
        params = {
            "engine": "google",
            "q": "weather ATL airport",
            "api_key": api_key
        }
        
        print(f"📤 REQUEST URL: {url}")
        print(f"📤 REQUEST PARAMS: {params}")
        print("🚨" * 50)
        
        response = requests.get(url, params=params, timeout=10)
        
        print(f"📥 RESPONSE STATUS: {response.status_code}")
        print("🚨" * 50)
        
        if response.status_code == 200:
            data = response.json()
            print(f"📥 RESPONSE KEYS: {list(data.keys())}")
            
            if 'weather_result' in data:
                weather = data['weather_result']
                print(f"📥 WEATHER FOUND:")
                print(f"   Temperature: {weather.get('temperature', 'N/A')}")
                print(f"   Weather: {weather.get('weather', 'N/A')}")
                print(f"   Wind: {weather.get('wind', 'N/A')}")
                print(f"   Location: {weather.get('location', 'N/A')}")
                return weather
            else:
                print("❌ NO WEATHER_RESULT FOUND")
                print(f"📥 FULL RESPONSE: {json.dumps(data, indent=2)[:1000]}...")
                return None
        else:
            print(f"❌ REQUEST FAILED: {response.status_code}")
            print(f"📥 ERROR RESPONSE: {response.text[:500]}")
            return None
            
    except Exception as e:
        print(f"❌ EXCEPTION: {str(e)}")
        return None

if __name__ == "__main__":
    test_serpapi_direct()