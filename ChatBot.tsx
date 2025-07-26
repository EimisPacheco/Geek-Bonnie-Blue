import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { flightRiskAPI } from '../../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatBotRef {
  openChat: () => void;
  closeChat: () => void;
}

// Component to render formatted flight analysis text
const FormattedFlightText: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');
  
  return (
    <div className="space-y-2">
      {lines.map((line, index) => {
        if (!line.trim()) return <div key={index} className="h-1" />;
        
        // Title line (contains flight number)
        if (line.includes('Flight') && line.includes('Analysis')) {
          return (
            <div key={index} className="font-bold text-blue-700 text-base">
              {line}
            </div>
          );
        }
        
        // Section headers
        if (line.includes('Key Risk Factors:') || line.includes('My Recommendations:') || line.includes('Route Analysis Results')) {
          return (
            <div key={index} className="font-semibold text-slate-700 mt-3 mb-1">
              {line}
            </div>
          );
        }
        
        // Risk level and score
        if (line.includes('Risk Level:') || line.includes('Risk Score:')) {
          return (
            <div key={index} className="font-medium text-slate-700">
              {line}
            </div>
          );
        }
        
        // Route and date info
        if (line.includes('Route:') || line.includes('Date:')) {
          return (
            <div key={index} className="text-slate-600">
              {line}
            </div>
          );
        }
        
        // Insurance recommendation
        if (line.includes('Insurance Recommendation:')) {
          return (
            <div key={index} className="bg-blue-50 p-2 rounded text-blue-800 text-sm mt-2">
              {line}
            </div>
          );
        }
        
        // Regular lines
        return (
          <div key={index} className="text-slate-700">
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const ChatBot = forwardRef<ChatBotRef>((props, ref) => {
  const { currentLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your flight risk advisor powered by multi-agent AI! Ask me anything about flight risks, insurance decisions, or help finding safer flights!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [sessionId, setSessionId] = useState<string>(`session_${Date.now()}`);

  // Expose methods to parent components
  useImperativeHandle(ref, () => ({
    openChat: () => setIsOpen(true),
    closeChat: () => setIsOpen(false)
  }));

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = inputText;
    setInputText('');

    try {
      // Call the real backend AI agents with intent detection
      const response = await flightRiskAPI.sendChatMessageWithIntentDetection({
        message: messageText,
        session_id: sessionId,
        context: {} // Could include flight search context here
      });

      let botResponseText = '';
      
      // Handle different response types based on intent
      if (response.success && response.orchestrator?.intent === 'direct_flight_lookup') {
        // Direct flight lookup response
        const flightData = response.flight_data;
        const riskAnalysis = response.risk_analysis;
        
        // Extract date from reasoning, removing the robotic explanation
        let dateInfo = '';
        if (response.orchestrator.reasoning) {
          const reasoning = response.orchestrator.reasoning;
          // Extract just the date part, removing the technical explanation
          const dateMatch = reasoning.match(/(\w+ \d+(?:st|nd|rd|th)? \d{4})/);
          if (dateMatch) {
            dateInfo = dateMatch[1];
          } else {
            // Fallback to show the date in a cleaner way
            dateInfo = reasoning.replace(/.*date \(([^)]+)\).*/, '$1').replace(/The message contains.*Therefore.*/, '').trim();
          }
        }
        
        botResponseText = `✈️ ${flightData.airline_name} Flight ${flightData.flight_number} Analysis\n\n` +
          `🛫 Route: ${flightData.origin_airport_code} → ${flightData.destination_airport_code}\n` +
          `📅 Date: ${dateInfo}\n\n` +
          `⚠️ Risk Level: ${riskAnalysis.risk_level.toUpperCase()}\n` +
          `📊 Risk Score: ${riskAnalysis.overall_risk_score}/100\n\n` +
          `Key Risk Factors:\n${riskAnalysis.key_risk_factors.map((f: string) => `• ${f}`).join('\n')}\n\n` +
          `My Recommendations:\n${riskAnalysis.recommendations.map((r: string) => `• ${r}`).join('\n')}\n\n` +
          `💡 Insurance Recommendation: Based on the ${riskAnalysis.risk_level} risk level, ` +
          `${riskAnalysis.risk_level === 'high' ? 'I strongly recommend' : riskAnalysis.risk_level === 'medium' ? 'I recommend considering' : 'insurance may not be necessary, but you could consider'} travel insurance for this flight.`;
      } else if (response.success && response.orchestrator?.intent === 'route_analysis') {
        // Route analysis response
        const flights = response.flights || [];
        if (flights.length > 0) {
          const routeInfo = response.route_info || {};
          const weatherAnalysis = response.weather_analysis || {};
          
          botResponseText = `✈️ Flight Options: ${routeInfo.origin} → ${routeInfo.destination}\n` +
            `📅 Date: ${routeInfo.date}\n\n` +
            `Found ${flights.length} flight options:\n\n` +
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            flights.slice(0, 5).map((flight: Record<string, any>, index: number) => {
              const riskAnalysis = flight.risk_analysis || {};
              const layoverText = flight.layovers && flight.layovers.length > 0 
                ? ` (${flight.layovers.length} stop${flight.layovers.length > 1 ? 's' : ''})`
                : ' (Direct)';
              
              return `${index + 1}. ${flight.airline_name} ${flight.flight_number} - $${flight.price}\n` +
                `   ⏱️ Duration: ${flight.duration}${layoverText}\n` +
                `   ⚠️ Risk: ${riskAnalysis.risk_level?.toUpperCase() || 'Unknown'} (${riskAnalysis.overall_risk_score || 0}/100)\n` +
                `   🛫 Departs: ${flight.departure_time}\n` +
                `   🛬 Arrives: ${flight.arrival_time}\n`;
            }).join('\n') +
            `\n🌤️ Weather Summary:\n` +
            `• Origin (${routeInfo.origin}): ${weatherAnalysis.origin_weather?.weather_conditions?.conditions || 'N/A'}\n` +
            `• Destination (${routeInfo.destination}): ${weatherAnalysis.destination_weather?.weather_conditions?.conditions || 'N/A'}\n\n` +
            `💡 My Recommendation: Based on the analysis, I recommend considering travel insurance for flights with medium or high risk levels. The weather conditions show some precipitation at both airports, so allow extra time for potential delays.`;
        } else {
          botResponseText = `❌ No flights found for this route. Please check your airports and date.`;
        }
      } else if (response.success && response.orchestrator?.intent === 'chat_conversation') {
        // Chat conversation response
        botResponseText = response.response || 'I can help you with flight risk analysis!';
      } else if (response.response) {
        // Fallback to response field
        botResponseText = response.response;
      } else {
        // Error case
        botResponseText = `❌ ${response.error || 'Unable to process your request. Please try again.'}`;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      
      // Update session ID if provided
      if (response.session_id !== sessionId) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('Chat API error:', error);
      // Fallback to local response if API fails
      const botResponse = getBotResponse(messageText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚠️ AI agents temporarily unavailable. Fallback response:\n\n${botResponse}`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }
  };

  const getBotResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    if (input.includes('insurance') || input.includes('should i get')) {
      return "Based on your flight details, I'd recommend considering insurance if:\n\n✈️ Your flight has multiple connections\n🌦️ You're traveling during storm season\n⏱️ Connection times are under 60 minutes\n📊 Historical delay rates are above 20%\n\nWould you like me to analyze a specific flight for you?";
    }
    
    if (input.includes('connection') || input.includes('layover')) {
      return "Connection time analysis is crucial! Here's what I consider:\n\n⏱️ Minimum recommended: 60+ minutes domestic, 90+ international\n🏃‍♂️ Terminal changes add 15-30 minutes\n📊 Average airport delay times\n🌦️ Weather patterns at connection hubs\n\nTell me your connection details and I'll assess the risk!";
    }
    
    if (input.includes('weather') || input.includes('storm') || input.includes('winter')) {
      return "Weather is a major risk factor! I analyze:\n\n❄️ Seasonal patterns (winter storms, summer thunderstorms)\n🌪️ Real-time weather forecasts\n📈 Historical weather delay data\n🛫 Airport-specific weather vulnerabilities\n\nWhich route and season are you concerned about?";
    }
    
    if (input.includes('cancel') || input.includes('delay')) {
      return "Flight disruptions depend on several factors:\n\n🛫 Airline reliability (varies by route)\n🌦️ Weather conditions\n✈️ Aircraft type and age\n🏢 Airport congestion\n📅 Day of week and time\n\nShare your flight details and I'll give you the real risk percentage!";
    }
    
    return "I can help you with:\n\n💰 Insurance recommendations\n📊 Flight risk analysis\n🔄 Connection assessments\n🌦️ Weather impact evaluation\n✈️ Alternative flight suggestions\n\nWhat specific question do you have about your travel plans?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 ${isOpen ? 'hidden' : 'block'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">
                  <TranslatedText text="Flight Risk Advisor" targetLanguage={currentLanguage} />
                </h3>
                <p className="text-xs text-blue-100">
                  <TranslatedText text="Online now" targetLanguage={currentLanguage} />
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {message.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`max-w-[280px] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {message.sender === 'bot' && (message.text.includes('Flight') && message.text.includes('Analysis') || message.text.includes('Route Analysis Results')) ? (
                    <FormattedFlightText text={message.text} />
                  ) : (
                    <div className="text-sm whitespace-pre-line">
                    <TranslatedText text={message.text} targetLanguage={currentLanguage} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about flight risks, insurance..."
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatBot.displayName = 'ChatBot';