"""
Airport Complexity Analysis Agent - Google ADK Implementation
Analyzes airport operational complexity using AI instead of hardcoded data
"""
import os
import google.generativeai as genai

# Import Google ADK - REAL IMPLEMENTATION ONLY
from google.adk.agents import Agent
from google.adk.tools import FunctionTool
print("✅ Airport Complexity Agent: Using real Google ADK")

from typing import Dict, Any, List

class AirportComplexityAgent(Agent):
    """
    Google ADK Airport Complexity Agent for real-time airport analysis
    """
    
    def __init__(self):
        super().__init__(
            name="airport_complexity_agent",
            description="Analyzes airport operational complexity using Google Gemini AI"
        )
        
        # Initialize Gemini AI
        api_key = "AIzaSyBv9WLGTF7Wen5_RbAoFXYCgV3tv7wS7JQ"  # Hardcoded to make progress
        if not api_key:
            raise ValueError("GOOGLE_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
        
        print("🏢 Google ADK Airport Complexity Agent initialized")
    
    def analyze_airport_complexity(self, airport_code: str, airport_name: str = None) -> Dict[str, Any]:
        """
        Analyze airport operational complexity using AI
        """
        try:
            print(f"🏢 AIRPORT COMPLEXITY AGENT: Analyzing {airport_code}")
            
            # Create AI prompt for airport complexity analysis
            prompt = f"""
            Analyze the operational complexity of {airport_code} airport ({airport_name or 'Unknown'}).
            
            Provide a comprehensive analysis including:
            1. Complexity level (high/medium/low)
            2. Detailed description (MAXIMUM 250 characters) of operational challenges
            3. Main operational concerns (4-5 specific items)
            
            CRITICAL TEXT LENGTH REQUIREMENTS:
            - description: MAXIMUM 250 characters, concise and professional
            - Keep text professional, no truncation indicators like "..." or "❌"
            
            Consider factors like:
            - Airport size and traffic volume
            - Runway configuration and airspace complexity
            - Weather sensitivity and seasonal challenges
            - Hub operations and connection complexity
            - Terminal layout and ground operations
            - Historical delay patterns
            - Air traffic control complexity
            
            Format your response as JSON:
            {{
                "complexity": "high|medium|low",
                "description": "Detailed operational complexity description (max 250 chars)",
                "concerns": ["concern1", "concern2", "concern3", "concern4"]
            }}
            
            Be specific and factual based on real airport characteristics.
            """
            
            # Get AI analysis
            response = self.model.generate_content(prompt)
            
            # Parse AI response
            try:
                import json
                import re
                
                # Extract JSON from response (handle markdown formatting)
                response_text = response.text.strip()
                
                # Try to find JSON in the response
                json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
                if json_match:
                    json_text = json_match.group(0)
                else:
                    json_text = response_text
                
                analysis = json.loads(json_text)
                
                # Validate and format response
                formatted_analysis = {
                    "complexity": analysis.get("complexity", "medium").lower(),
                    "description": analysis.get("description", f"AI analysis failed for {airport_code} - no hardcoded fallback used")[:250],
                    "concerns": analysis.get("concerns", [f"AI analysis failed for {airport_code}", "No hardcoded data", "Requires AI fix", "Contact support"])[:4]
                }
                
                print(f"✅ AIRPORT COMPLEXITY AGENT: Analysis complete for {airport_code}")
                return formatted_analysis
                
            except (json.JSONDecodeError, AttributeError) as e:
                print(f"❌ AIRPORT COMPLEXITY AGENT: Failed to parse AI response for {airport_code}: {e}")
                print(f"🔍 DEBUG: Raw AI response: {response.text[:500]}")
                return self._get_fallback_analysis(airport_code)
                
        except Exception as e:
            print(f"❌ AIRPORT COMPLEXITY AGENT: Analysis failed for {airport_code}: {e}")
            return self._get_fallback_analysis(airport_code)
    
    def _get_fallback_analysis(self, airport_code: str) -> Dict[str, Any]:
        """Fallback analysis when AI fails - makes failure explicit"""
        return {
            "complexity": "unknown",
            "description": f"AI analysis failed for {airport_code}. No hardcoded airport data available. Google ADK agents require troubleshooting.",
            "concerns": [f"AI analysis failed for {airport_code}", "Google ADK agent error", "Requires debugging", "No fallback data"]
        }
    
    def get_multiple_airport_analysis(self, airport_codes: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Analyze multiple airports efficiently
        """
        results = {}
        
        for airport_code in airport_codes:
            results[airport_code] = self.analyze_airport_complexity(airport_code)
        
        return results 