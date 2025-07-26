```
# FlightRiskRadar Architecture Overview

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER INTERFACE LAYER                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🌐 React Web App (TypeScript + Vite)                                          │
│  ├── HomePage.tsx (Hero + Search Forms)                                        │
│  ├── SearchResultsPage.tsx (Flight Cards + Risk Analysis)                      │
│  ├── FlightCard.tsx (Individual Flight Display)                                │
│  ├── RiskInsights.tsx (Risk Visualization)                                     │
│  ├── ConnectionAnalysis.tsx (Layover Analysis)                                 │
│  ├── InsuranceRecommendations.tsx (Insurance Advice)                          │
│  └── Chrome Extension Promotion (3 locations)                                  │
│                                                                                 │
│  📱 Mobile Responsive + Dark/Light Mode + Multi-language Support               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              AGENT CORE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│  🧠 Google Agent Development Kit (ADK) - Multi-Agent System                    │
│                                                                                 │
│  📋 PLANNER: Task Orchestration                                                │
│  ├── main.py (Unified Orchestrator)                                            │
│  │   ├── _handle_direct_flight_analysis()                                      │
│  │   ├── _handle_extension_flight_analysis()                                   │
│  │   └── _handle_route_search_analysis()                                       │
│  └── Request Routing Logic                                                      │
│                                                                                 │
│  ⚡ EXECUTOR: Specialized AI Agents                                            │
│  ├── data_analyst_agent.py (Data Retrieval & Parsing)                          │
│  ├── weather_intelligence_agent.py (Weather Analysis)                          │
│  ├── airport_complexity_agent.py (Airport Risk Assessment)                     │
│  ├── layover_analysis_agent.py (Connection Analysis)                           │
│  ├── risk_assessment_agent.py (Overall Risk Scoring)                           │
│  ├── insurance_recommendation_agent.py (Insurance Advice)                      │
│  └── chat_advisor_agent.py (Natural Language Responses)                        │
│                                                                                 │
│  🧠 MEMORY: Context & State Management                                         │
│  ├── FlightContext.tsx (React Context - Frontend State)                        │
│  ├── Response Caching (API Response Caching)                                   │
│  └── Session State (Search Parameters, Selected Flights)                       │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TOOLS / APIs LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│  �� EXTERNAL DATA SOURCES                                                       │
│  ├── SerpAPI (Real-time Flight Data - Route Search)                            │
│  ├── Google BigQuery (Historical Flight Data - 3 years)                        │
│  │   └── airline_data.flight_data table                                        │
│  └── Weather APIs (Real-time Weather Conditions)                               │
│                                                                                 │
│  🛠️ CUSTOM TOOLS                                                               │
│  ├── weather_tool.py (Weather Intelligence Tool)                               │
│  ├── bigquery_tool.py (Historical Data Tool)                                   │
│  └── timeUtils.ts (Duration/Time Formatting)                                   │
│                                                                                 │
│  🌐 DEPLOYMENT INFRASTRUCTURE                                                   │
│  ├── Google Cloud Functions (Python 3.11)                                      │
│  ├── Cloud Build (Automated Deployment)                                        │
│  └── Environment Variables (API Keys Management)                               │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              OBSERVABILITY LAYER                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📊 LOGGING & MONITORING                                                        │
│  ├── Console Logging (Frontend: console.log)                                   │
│  ├── Print Statements (Backend: print())                                       │
│  │   └── "LOGS START" + timestamp + parameters + "LOGS ENDS"                   │
│  └── Error Tracking (User-friendly error messages)                             │
│                                                                                 │
│  🔄 ERROR HANDLING & RETRIES                                                    │
│  ├── API Retry Logic (callCloudFunctionWithRetry)                              │
│  ├── Graceful Degradation (Fallback UI messages)                               │
│  ├── Data Validation (Input sanitization)                                      │
│  └── 100% Transparency (No hardcoded fallbacks)                                │
│                                                                                 │
│  📈 PERFORMANCE MONITORING                                                      │
│  ├── Loading States (Spinning animations)                                      │
│  ├── Response Time Tracking                                                     │
│  └── Cache Hit/Miss Monitoring                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

# Data Flow Architecture

┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│  React App  │───▶│ Cloud Func  │───▶│   ADK       │
│  Input      │    │ (Frontend)  │    │ (Backend)   │    │  Agents     │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
                    │   Cache     │    │   SerpAPI   │    │  BigQuery   │
                    │ (Responses) │    │ (Live Data) │    │(Historical) │
                    └─────────────┘    └─────────────┘    └─────────────┘

# Key Features

✅ **Multi-Modal Input**: Route Search (SerpAPI) + Direct Flight (BigQuery) + Extension Data
✅ **Real-time Analysis**: Weather, Airport Complexity, Layover Risk, Insurance Recommendations  
✅ **AI-Powered Insights**: Risk scoring, delay probability, cancellation rates
✅ **User Experience**: Dark/Light mode, multi-language, mobile responsive
✅ **Chrome Extension**: Seamless integration with Google Flights
✅ **Transparency**: No hardcoded data, clear error messages, comprehensive logging
```

This architecture demonstrates a sophisticated multi-agent system that combines real-time data analysis, historical insights, and user-friendly interfaces to provide comprehensive flight risk assessment and insurance recommendations.
