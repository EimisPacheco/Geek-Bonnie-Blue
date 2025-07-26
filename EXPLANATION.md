# Technical Explanation

## 1. Agent Workflow

### Step-by-Step Processing Flow:

**1. Receive User Input**
```typescript
// Frontend: FlightContext.tsx
const searchFlights = (params: SearchParams) => {
  // Input validation and formatting
  const cacheKey = generateCacheKey(params, 'route');
  const cachedResult = getCachedResult(cacheKey);
  
  if (cachedResult) {
    setFlights(cachedResult);
    return;
  }
  
  // Prepare request payload
  const requestData = {
    origin: params.origin,
    destination: params.destination,
    date: params.departureDate,
    trip_type: params.tripType === 'oneWay' ? 'one_way' : 'round_trip',
    passengers: params.passengers
  };
}
```

**2. Retrieve Relevant Memory (Caching)**
```typescript
// Cache management in FlightContext.tsx
const getCachedResult = (cacheKey: string): any | null => {
  const cached = flightCache[cacheKey];
  if (cached && isCacheValid(cached)) {
    console.log('🔍 Cache hit for:', cacheKey);
    return cached.data;
  }
  return null;
};
```

**3. Plan Sub-tasks (Multi-Agent Orchestration)**
```python
# Backend: main.py - Unified Orchestrator
def main(request):
    request_data = request.get_json()
    
    if request_data.get('extension'):
        # Chrome Extension Flow
        return _handle_extension_flight_analysis(params)
    elif request_data.get('airline') and request_data.get('flight_number'):
        # Direct Flight Lookup Flow
        return _handle_direct_flight_analysis(params)
    else:
        # Route Search Flow
        return _handle_route_search_analysis(params)
```

**4. Call Tools/APIs as Needed**
```python
# Sequential Agent Execution
def _handle_route_search_analysis(params):
    # 1. Data Analyst Agent - Get flight data
    data_agent = DataAnalystAgent()
    flight_data = data_agent.get_flight_data(params)
    
    # 2. Weather Intelligence Agent - Analyze weather
    weather_agent = WeatherIntelligenceAgent()
    weather_analysis = weather_agent.analyze_weather_conditions(flight_data)
    
    # 3. Airport Complexity Agent - Assess airports
    airport_agent = AirportComplexityAgent()
    airport_analysis = airport_agent.analyze_airport_complexity(flight_data)
    
    # 4. Layover Analysis Agent - Connection risk
    layover_agent = LayoverAnalysisAgent()
    layover_analysis = layover_agent.analyze_layovers(flight_data)
    
    # 5. Risk Assessment Agent - Overall scoring
    risk_agent = RiskAssessmentAgent()
    risk_analysis = risk_agent.generate_flight_risk_analysis(flight_data, weather_analysis, params)
    
    # 6. Insurance Recommendation Agent - Insurance advice
    insurance_agent = InsuranceRecommendationAgent()
    insurance_analysis = insurance_agent.generate_insurance_recommendation(risk_analysis)
```

**5. Summarize and Return Final Output**
```python
# Comprehensive response assembly
return {
    'success': True,
    'flights': flight_data,
    'weather_analysis': weather_analysis,
    'airport_analysis': airport_analysis,
    'layover_analysis': layover_analysis,
    'risk_assessment': risk_analysis,
    'insurance_recommendation': insurance_analysis,
    'adk_status': adk_status
}
```

## 2. Key Modules

### **Planner** (`main.py` - Unified Orchestrator):
```python
class UnifiedOrchestrator:
    def __init__(self):
        self.agents = {
            'data_analyst': DataAnalystAgent(),
            'weather_intelligence': WeatherIntelligenceAgent(),
            'airport_complexity': AirportComplexityAgent(),
            'layover_analysis': LayoverAnalysisAgent(),
            'risk_assessment': RiskAssessmentAgent(),
            'insurance_recommendation': InsuranceRecommendationAgent(),
            'chat_advisor': ChatAdvisorAgent()
        }
    
    def plan_execution(self, request_type, params):
        if request_type == 'extension':
            return self._plan_extension_flow(params)
        elif request_type == 'direct':
            return self._plan_direct_flow(params)
        else:
            return self._plan_route_flow(params)
```

### **Executor** (Individual Agent Classes):
```python
class DataAnalystAgent:
    def get_flight_data(self, params):
        # SerpAPI integration for route search
        # BigQuery integration for direct flight lookup
        # Data parsing and normalization
        pass

class RiskAssessmentAgent:
    def generate_flight_risk_analysis(self, flight_data, weather_analysis, params):
        # AI-powered risk scoring
        # Historical performance analysis
        # Seasonal factor integration
        pass
```

### **Memory Store** (`FlightContext.tsx` + Caching):
```typescript
interface FlightCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiresAt: number;
  };
}

const flightCache: FlightCache = {};

const setCachedResult = (cacheKey: string, data: any): void => {
  flightCache[cacheKey] = {
    data,
    timestamp: Date.now(),
    expiresAt: getCacheExpiryTime()
  };
};
```

## 3. Tool Integration

### **External APIs and Tools:**

**SerpAPI (Flight Data)**
```python
# data_analyst_agent.py
def _search_flights_serpapi(self, params):
    url = "https://serpapi.com/search"
    payload = {
        "engine": "google_flights",
        "departure_id": params['origin'],
        "arrival_id": params['destination'],
        "date": params['date'],
        "api_key": os.getenv('SERPAPI_API_KEY')
    }
    response = requests.get(url, params=payload)
    return response.json()
```

**Google BigQuery (Historical Data)**
```python
# bigquery_tool.py
def get_airline_performance(airline_code, flight_number):
    query = f"""
    SELECT * FROM airline_data.flight_data 
    WHERE airline_code = '{airline_code}' 
    AND flight_number = '{flight_number}'
    ORDER BY departure_date DESC LIMIT 100
    """
    return client.query(query).to_dataframe()
```

**Weather APIs (Real-time Conditions)**
```python
# weather_tool.py
def get_weather_data(city_or_airport):
    # Multiple weather API integrations
    # City name or airport code support
    # Real-time conditions and forecasts
    pass
```

**Google Agent Development Kit (ADK)**
```python
# All agent classes inherit from ADK base
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import google.generativeai as genai

class BaseAgent:
    def __init__(self):
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        self.model = genai.GenerativeModel('gemini-1.5-flash')
```

## 4. Observability & Testing

### **Comprehensive Logging System:**

**Frontend Logging:**
```typescript
// Consistent logging format across all components
console.log('🔍 LOGS START', new Date().toISOString());
console.log('🔍 SUBMITTED PARAMETERS:', params);
console.log('🔍 API RESPONSE:', response);
console.log('🔍 LOGS ENDS', new Date().toISOString());
```

**Backend Logging:**
```python
# main.py - Request tracking
print(f"🔌 UNIFIED ORCHESTRATOR: Processing {request_type} analysis")
print(f"�� Request parameters: {params}")

# Agent-specific logging
print(f"🌤️ Weather Intelligence Agent: Analyzing conditions for {airport}")
print(f"�� Airport Complexity Agent: Assessing {airport} complexity")
print(f"⏱️ Layover Analysis Agent: Processing {len(layovers)} layovers")
```

**Error Handling:**
```python
try:
    result = agent.process_data(data)
except Exception as e:
    print(f"❌ Agent error: {str(e)}")
    return {
        'success': False,
        'error': f'Analysis failed: {str(e)}',
        'user_message': 'Unable to complete analysis. Please try again.'
    }
```

### **Testing Infrastructure:**
```bash
# deploy.sh - Automated testing and deployment
#!/bin/bash
echo "🧪 Testing cloud function..."
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{"origin": "JFK", "destination": "SFO", "date": "2025-07-30"}'

echo "🚀 Deploying to production..."
gcloud functions deploy flight-risk-analysis \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated
```

## 5. Known Limitations

### **Performance Bottlenecks:**
- **SerpAPI Rate Limits**: 100 searches per month, can cause 400 errors
- **BigQuery Query Time**: Historical data queries can take 5-10 seconds
- **Weather API Latency**: Multiple API calls for layover airports
- **AI Model Response Time**: Gemini API calls for each agent (6+ agents per request)

### **Edge Cases:**
- **Ambiguous Airport Codes**: Some airports share codes (e.g., multiple "LAX" references)
- **Missing Historical Data**: New routes or airlines without 3-year history
- **Weather API Failures**: Unavailable weather data for remote airports
- **SerpAPI Data Inconsistencies**: Incomplete flight information for some routes

### **Input Validation Challenges:**
- **Date Format Variations**: Multiple date formats supported but can cause parsing errors
- **Airline Code Mapping**: Full names vs IATA codes (e.g., "United Airlines" vs "UA")
- **Airport Name Variations**: "JFK" vs "John F. Kennedy International Airport"

### **Scalability Considerations:**
- **Concurrent Requests**: Cloud Function timeout at 9 minutes
- **Memory Usage**: Large response payloads (multiple flight options + analysis)
- **Cache Management**: Cache expiration and memory usage for high-traffic scenarios

### **Data Quality Issues:**
- **Incomplete SerpAPI Responses**: Missing layover information or flight segments
- **Historical Data Gaps**: Missing performance data for new aircraft types
- **Weather Data Accuracy**: Forecast reliability for long-range predictions

### **User Experience Limitations:**
- **Loading Times**: 15-30 seconds for comprehensive analysis
- **Mobile Performance**: Large payloads on slow connections
- **Browser Compatibility**: Chrome Extension only (no Firefox/Safari support)

**Mitigation Strategies:**
- Implement request queuing for high-traffic periods
- Add progressive loading for large datasets
- Expand browser extension support
- Implement fallback data sources for critical APIs
