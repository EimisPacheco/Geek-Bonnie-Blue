import React, { useState } from 'react';
import { Flight } from '../../context/FlightContext';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { Plane, Shield, AlertTriangle, CheckCircle, Clock, MapPin, Star } from 'lucide-react';
import { useDarkMode } from '../../context/DarkModeContext';
import { formatRiskLevel, calculateHighestWeatherRisk, calculateHighestAirportComplexity } from '../../utils/textUtils';
import AirportLocationViewer from './AirportLocationViewer';
import { getAirlineOnTimeRate, getAirlineWebsite, getAirlineRating } from '../../utils/airlinesData';
import { formatLayoverDuration } from '../../utils/timeUtils';

// Helper function to convert airline name to airline code
const getAirlineCode = (airlineName: string): string => {
  console.log(`🔍 Converting airline name: "${airlineName}"`);
  
  // Normalize the airline name for better matching
  const normalizedName = airlineName.toLowerCase().trim();
  
  const airlineMap: { [key: string]: string } = {
    'american airlines': 'AA',
    'delta air lines': 'DL',
    'united airlines': 'UA',
    'southwest airlines': 'WN',
    'jetblue airways': 'B6',
    'alaska airlines': 'AS',
    'spirit airlines': 'NK',
    'frontier airlines': 'F9',
    'allegiant air': 'G4',
    'hawaiian airlines': 'HA',
    'envoy air': 'MQ',
    'skywest airlines': 'OO',
    'republic airlines': 'YX',
    'endeavor air': '9E',
    'expressjet airlines': 'EV',
    'horizon air': 'QX',
    'mesa airlines': 'YV',
    'piedmont airlines': 'PT',
    'psa airlines': 'OH',
    'trans states airlines': 'AX',
    'air wisconsin': 'ZW',
    'gojet airlines': 'G7',
    'compass airlines': 'CP',
    'empire airlines': 'EM',
    'fedex express': 'FX',
    'ups airlines': '5X',
    'air transport international': 'ATI',
    'abx air': 'ABX',
    'kalitta air': 'KAL',
    'swift air': 'SBU',
    'kalitta charters': 'CKS',
    'cargojet airways': 'CJT',
    'executive fliteways': 'XSR',
    'itaca': 'TTA',
    'sun country airlines': 'SY',
    'virgin america': 'VX',
    'airtran airways': 'FL',
    'champlain air': 'C5',
    'penair': 'KS',
    'trans states holdings': 'LOF',
    'jetstream international airlines': 'JIA'
  };
  
  // Try exact match first
  let result = airlineMap[normalizedName];
  
  // If no exact match, try partial matching
  if (!result) {
    for (const [name, code] of Object.entries(airlineMap)) {
      if (normalizedName.includes(name) || name.includes(normalizedName)) {
        result = code;
        console.log(`🔍 Partial match found: "${airlineName}" matches "${name}" -> "${code}"`);
        break;
      }
    }
  }
  
  // If still no match, return the original name
  if (!result) {
    result = airlineName;
    console.log(`🔍 No match found for: "${airlineName}", using original`);
  } else {
    console.log(`🔍 Exact match found: "${airlineName}" -> "${result}"`);
  }
  
  return result;
};

interface FlightCardProps {
 flight: Flight;
 onSelect: (flight: Flight) => void;
 isExpanded?: boolean;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, onSelect, isExpanded = false }) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    content: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    content: '',
    x: 0,
    y: 0,
    visible: false
  });

  // Airport map modal state
  const [selectedAirport, setSelectedAirport] = useState<{
    code: string;
    name: string;
    city: string;
    complexity: string;
    description: string;
  } | null>(null);
  
  // Debug logging
  console.log('🔍 FlightCard Debug:', {
    finalSegmentTravelTime: flight.finalSegmentTravelTime,
    hasConnections: flight.connections && flight.connections.length > 0,
    connectionsLength: flight.connections?.length,
    flightId: flight.id
  });

  // Helper function to generate tooltip content for airport codes
  const getAirportTooltipContent = (airportCode: string, isOrigin: boolean = false, isDestination: boolean = false) => {
    // Debug dark mode state
    console.log('🔍 Tooltip Debug - isDarkMode:', isDarkMode);
    
    let weatherRisk = 'Unknown';
    let airportComplexity = 'Unknown';
    let weatherDescription = 'Weather data unavailable';
    let complexityDescription = 'Airport complexity data unavailable';

    if (isOrigin) {
      weatherRisk = formatRiskLevel(flight.originAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk);
      airportComplexity = formatRiskLevel(flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity);
      weatherDescription = flight.originAnalysis?.weather_risk?.description || `Weather conditions at ${airportCode}`;
      complexityDescription = flight.originAnalysis?.airport_complexity?.description || `Airport complexity at ${airportCode}`;
    } else if (isDestination) {
      weatherRisk = formatRiskLevel(flight.destinationAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk);
      airportComplexity = formatRiskLevel(flight.destinationAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity);
      weatherDescription = flight.destinationAnalysis?.weather_risk?.description || `Weather conditions at ${airportCode}`;
      complexityDescription = flight.destinationAnalysis?.airport_complexity?.description || `Airport complexity at ${airportCode}`;
    } else {
      // For layover airports, try to find connection data
      const connection = flight.connections?.find(conn => conn.layoverInfo?.airport === airportCode);
      if (connection?.layoverInfo?.weather_risk) {
        weatherRisk = formatRiskLevel(connection.layoverInfo.weather_risk.level || 'medium');
        weatherDescription = connection.layoverInfo.weather_risk.description || `Weather conditions at ${airportCode}`;
      }
      if (connection?.layoverInfo?.airport_complexity) {
        airportComplexity = formatRiskLevel(connection.layoverInfo.airport_complexity.complexity || 'medium');
        complexityDescription = connection.layoverInfo.airport_complexity.description || `Airport complexity at ${airportCode}`;
      }
    }

    const tooltipContent = `
      <div class="space-y-3">
        <div class="font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}">${airportCode} Airport Analysis</div>
        <div class="space-y-2">
          <div>
            <div class="text-xs font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}">🌤️ Weather Risk: <span class="${getWeatherRiskColor(weatherRisk, isDarkMode)}">${weatherRisk}</span></div>
            <div class="text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} mt-1 leading-relaxed">${weatherDescription}</div>
          </div>
          <div>
            <div class="text-xs font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}">🏢 Airport Complexity: <span class="${getComplexityColor(airportComplexity, isDarkMode)}">${airportComplexity}</span></div>
            <div class="text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'} mt-1 leading-relaxed">${complexityDescription}</div>
          </div>
        </div>
      </div>
    `;

    return tooltipContent;
  };

  // Tooltip event handlers
  const handleMouseEnter = (event: React.MouseEvent, airportCode: string, isOrigin: boolean = false, isDestination: boolean = false) => {
    const content = getAirportTooltipContent(airportCode, isOrigin, isDestination);
    setTooltip({
      content,
      x: event.clientX + 10,
      y: event.clientY - 10,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  // Airline rating tooltip handler
  const handleAirlineRatingMouseEnter = (event: React.MouseEvent, rating: number) => {
    const tooltipContent = `
      <div class="space-y-2">
        <div class="font-bold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-900'}">Airline User Rating</div>
        <div class="text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}">
          Customer satisfaction rating based on passenger reviews and feedback
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-lg font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}">${rating}/5</span>
          <div class="flex space-x-0.5">
            ${Array(5).fill(0).map((_, i) => 
              i < Math.floor(rating) 
                ? `<span class="text-yellow-400">★</span>` 
                : i < rating 
                  ? `<span class="text-yellow-400">☆</span>` 
                  : `<span class="text-gray-400">☆</span>`
            ).join('')}
          </div>
        </div>
      </div>
    `;
    
    setTooltip({
      content: tooltipContent,
      x: event.clientX + 10,
      y: event.clientY - 10,
      visible: true
    });
  };

  // Airport map preview handlers
  const handleAirportClick = (airportCode: string, airportName: string, city: string) => {
    // Get complexity and description from flight data
    let complexity = 'Medium';
    let description = `${airportName} serves as a major aviation hub with modern facilities and comprehensive services.`;

    if (airportCode === flight.departure.airport.code) {
      complexity = formatRiskLevel(flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity);
      description = flight.originAnalysis?.airport_complexity?.description || description;
    } else if (airportCode === flight.arrival.airport.code) {
      complexity = formatRiskLevel(flight.destinationAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity);
      description = flight.destinationAnalysis?.airport_complexity?.description || description;
    } else {
      // For layover airports
      const connection = flight.connections?.find(conn => conn.layoverInfo?.airport === airportCode);
      if (connection?.layoverInfo?.airport_complexity) {
        complexity = formatRiskLevel(connection.layoverInfo.airport_complexity.complexity || 'medium');
        description = connection.layoverInfo.airport_complexity.description || description;
      }
    }

    setSelectedAirport({
      code: airportCode,
      name: airportName,
      city: city,
      complexity: complexity,
      description: description
    });
  };

  const closeAirportMap = () => {
    setSelectedAirport(null);
  };

  // Helper function to get color for airport complexity
  const getComplexityColor = (complexity: string, isDark: boolean = false) => {
    const normalizedComplexity = complexity.toLowerCase().replace(/\s+/g, '');
    console.log('🔍 Complexity color for:', complexity, 'normalized to:', normalizedComplexity);
    
    if (isDark) {
      switch (normalizedComplexity) {
        case 'low':
          return 'text-green-400 font-bold';
        case 'medium':
          return 'text-yellow-400 font-bold';
        case 'high':
          return 'text-red-400 font-bold';
        default:
          return 'text-white';
      }
    } else {
      switch (normalizedComplexity) {
        case 'low':
          return 'text-green-700 font-bold';
        case 'medium':
          return 'text-yellow-700 font-bold';
        case 'high':
          return 'text-red-700 font-bold';
        default:
          return 'text-slate-600';
      }
    }
  };

  // Helper function to get color for weather risk
  const getWeatherRiskColor = (weatherRisk: string, isDark: boolean = false) => {
    const normalizedWeatherRisk = weatherRisk.toLowerCase().replace(/\s+/g, '');
    console.log('🌤️ Weather risk color for:', weatherRisk, 'normalized to:', normalizedWeatherRisk);
    
    if (isDark) {
      switch (normalizedWeatherRisk) {
        case 'low':
          return 'text-green-400 font-semibold';
        case 'medium':
          return 'text-yellow-400 font-semibold';
        case 'high':
          return 'text-red-400 font-semibold';
        default:
          return 'text-slate-300';
      }
    } else {
      switch (normalizedWeatherRisk) {
        case 'low':
          return 'text-green-700 font-semibold';
        case 'medium':
          return 'text-yellow-700 font-semibold';
        case 'high':
          return 'text-red-700 font-semibold';
        default:
          return 'text-slate-500';
      }
    }
  };

  const getLayoverStatus = (flight: Flight) => {
   // Use AI-generated connection risk assessment instead of hardcoded thresholds
   const riskLevel = flight.riskFactors.connectionRisk;
   if (riskLevel === 'high') return 'Connection Risk';
   if (riskLevel === 'medium') return 'Reasonable Layover';
     return 'Plenty of Time';
 };

 const getLayoverTextColor = (flight: Flight) => {
   // Use AI-generated connection risk assessment instead of hardcoded thresholds
   const riskLevel = flight.riskFactors.connectionRisk;
   if (riskLevel === 'high') return 'text-red-600';
   if (riskLevel === 'medium') return 'text-yellow-600';
     return 'text-green-600';
 };

 const getSegmentDurationInMinutes = (duration: string) => {
   // If duration is just a number (like "135"), it's already in minutes
   if (!isNaN(Number(duration))) {
     return parseInt(duration);
   }
   
   // If duration has "h" and "m", parse it as "Xh Ym" format
   const hours = parseInt(duration.split('h')[0]) || 0;
   const minutes = parseInt(duration.split('h')[1]?.split('m')[0]) || 0;
   return hours * 60 + minutes;
 };

 const getRiskIcon = (level: string) => {
   switch (level) {
     case 'low':
       return <CheckCircle className="w-5 h-5 text-green-600" />;
     case 'medium':
       return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
     case 'high':
       return <AlertTriangle className="w-5 h-5 text-red-600" />;
     default:
       return <Shield className="w-5 h-5 text-slate-400" />;
   }
 };

 const getRiskColor = (level: string) => {
   if (isDarkMode) {
     switch (level) {
       case 'low':
         return 'bg-green-900/30 border-green-700 text-green-200';
       case 'medium':
         return 'bg-yellow-900/30 border-yellow-700 text-yellow-200';
       case 'high':
         return 'bg-red-900/30 border-red-700 text-red-200';
       default:
         return 'bg-slate-800 border-slate-600 text-slate-200';
     }
   } else {
   switch (level) {
     case 'low':
       return 'bg-green-50 border-green-200 text-green-800';
     case 'medium':
       return 'bg-yellow-50 border-yellow-200 text-yellow-800';
     case 'high':
       return 'bg-red-50 border-red-200 text-red-800';
     default:
       return 'bg-slate-50 border-slate-200 text-slate-800';
   }
   }
 };

 const getInsuranceRecommendation = (flight: Flight) => {
   // Use AI-generated insurance recommendation if available
   const aiRecommendation = flight.insurance_recommendation;
   
   if (aiRecommendation && aiRecommendation.success && aiRecommendation.recommendation_type) {
     switch (aiRecommendation.recommendation_type) {
       case 'skip_insurance':
         return { text: 'Save your money', icon: '❌', color: 'text-green-700' };
       case 'consider_insurance':
         return { text: 'Consider it', icon: '⚠️', color: 'text-yellow-700' };
       case 'strongly_recommend':
         return { text: 'Recommended', icon: '✅', color: 'text-red-700' };
       default:
         return { text: 'Consider it', icon: '⚠️', color: 'text-yellow-700' };
     }
   }
   
   // Fallback to risk-based logic only if AI recommendation is not available
   switch (flight.riskLevel) {
     case 'low':
       return { text: 'Save your money', icon: '❌', color: 'text-green-700' };
     case 'medium':
       return { text: 'Consider it', icon: '⚠️', color: 'text-yellow-700' };
     case 'high':
       return { text: 'Recommended', icon: '✅', color: 'text-red-700' };
     default:
       return { text: 'Uncertain', icon: '❓', color: 'text-slate-700' };
   }
 };

 const getCardStyling = (level: string) => {
  if (isDarkMode) {
    switch (level) {
      case 'low':
        return 'border-slate-700/50 border-l-4 border-l-green-500';
      case 'medium':
        return 'border-slate-700/50 border-l-4 border-l-orange-500';
      case 'high':
        return 'border-slate-700/50 border-l-4 border-l-red-500';
      default:
        return 'border-slate-700/50';
    }
  } else {
   switch (level) {
     case 'low':
       return 'bg-white border-slate-200 border-l-4 border-l-green-500';
     case 'medium':
       return 'bg-white border-slate-200 border-l-4 border-l-orange-500';
     case 'high':
       return 'bg-white border-slate-200 border-l-4 border-l-red-500';
     default:
       return 'bg-white border-slate-200';
   }
  }
 };

 const insurance = getInsuranceRecommendation(flight);

  const formatTimeWithAMPM = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  const formatDuration = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${minutes}m`;
  };

 return (
   <>
     <div className={`relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:border-blue-400 hover:scale-[1.02] cursor-pointer ${getCardStyling(flight.riskLevel)} ${
       isDarkMode 
         ? 'bg-slate-800/80 backdrop-blur-md shadow-slate-900/20' 
         : 'shadow-lg'
     }`}>
     {/* Header with airline and risk */}
     <div className="flex items-center justify-between mb-4">
       <div className="flex items-center space-x-3">
           <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'} overflow-hidden`}>
             <img 
               src={`https://www.gstatic.com/flights/airline_logos/70px/${getAirlineCode(flight.airline)}.png`}
               alt={`${flight.airline} logo`}
               className="w-8 h-8 object-contain"
               onError={(e) => {
                 console.log(`❌ Airline logo failed to load for: ${flight.airline} -> ${getAirlineCode(flight.airline)}`);
                 console.log(`❌ Failed URL: https://www.gstatic.com/flights/airline_logos/70px/${getAirlineCode(flight.airline)}.png`);
                 const target = e.target as HTMLImageElement;
                 target.style.display = 'none';
                 target.nextElementSibling?.classList.remove('hidden');
               }}
               onLoad={() => {
                 console.log(`✅ Airline logo loaded successfully for: ${flight.airline} -> ${getAirlineCode(flight.airline)}`);
                 console.log(`✅ Success URL: https://www.gstatic.com/flights/airline_logos/70px/${getAirlineCode(flight.airline)}.png`);
               }}
             />
             <div className={`hidden w-8 h-8 flex items-center justify-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
               <Plane className="w-5 h-5" />
             </div>
         </div>
         <div>
             <h3 className={`font-semibold flex items-center space-x-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
               {(() => {
                 const website = getAirlineWebsite(flight.airline);
                 if (website) {
                   return (
                     <a 
                       href={website} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="hover:text-blue-500 hover:underline transition-colors duration-200"
                       onClick={(e) => e.stopPropagation()}
                     >
                       {flight.airline}
                     </a>
                   );
                 }
                 return flight.airline;
               })()}
               {(() => {
                 const rating = getAirlineRating(flight.airline);
                 if (rating !== null) {
                   return (
                     <div 
                       className="flex items-center space-x-1 cursor-help"
                       onMouseEnter={(e) => handleAirlineRatingMouseEnter(e, rating)}
                       onMouseLeave={handleMouseLeave}
                     >
                       <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                         {rating}
                       </span>
                       <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                     </div>
                   );
                 }
                 return null;
               })()}
             </h3>
             <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
               {flight.flightNumber} • {flight.aircraft}
               {(() => {
                 // Use dynamic On-Time Rate from Cloud Function if available, otherwise fall back to static data
                 const dynamicOnTimeRate = flight.on_time_rate;
                 const staticOnTimeRate = getAirlineOnTimeRate(flight.airline);
                 const onTimeRate = dynamicOnTimeRate !== null && dynamicOnTimeRate !== undefined ? dynamicOnTimeRate : staticOnTimeRate;
                 
                 if (onTimeRate !== null) {
                   return (
                     <span className={`ml-2 px-2 py-0.5 rounded text-xs font-medium ${
                       onTimeRate >= 80 ? 'bg-green-100 text-green-800' :
                       onTimeRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                       'bg-red-100 text-red-800'
                     }`}>
                       ⏰ {onTimeRate}% On-Time
                       {dynamicOnTimeRate !== null && dynamicOnTimeRate !== undefined ? ' (Historical)' : ''}
                     </span>
                   );
                 }
                 return null;
               })()}
             </p>
         </div>
       </div>
       <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center space-x-2 ${getRiskColor(flight.riskLevel)}`}>
         {getRiskIcon(flight.riskLevel)}
         <span>
           <TranslatedText
             text={`${flight.riskLevel.charAt(0).toUpperCase() + flight.riskLevel.slice(1)} Risk`}
             targetLanguage={currentLanguage}
           />
         </span>
       </div>
     </div>

     {/* Flight details */}
     <div className="flex items-center justify-center mb-4">
       <div className="flex-1 mx-6">
         <div className="flex items-center justify-center space-x-2 text-slate-500">
             <div className={`h-0.5 flex-1 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
           <div className="flex flex-col items-center">
               <Clock className="w-4 h-4" />
             {flight.connections && flight.connections.length > 0 ? (
                 <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{flight.duration}</span>
             ) : (
                 <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Direct Flight</span>
             )}
           </div>
             <div className={`h-0.5 flex-1 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
         </div>
         {/* Always show Flight Timeline for both direct flights and flights with connections */}
           <div className={`mt-1 p-4 mx-[-1rem] rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-slate-50'}`}>
           <div className="flex items-center gap-1 mb-0.5">
             <Plane className="w-3 h-3 text-blue-600" />
               <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
               <TranslatedText text="Flight Timeline" targetLanguage={currentLanguage} />
             </span>
           </div>
          
           <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
             <div className="flex items-center w-full min-w-max">
               {/* Departure time */}
               <div className="flex-shrink-0 text-center relative z-10">
                   <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatTimeWithAMPM(flight.departure.time)}</div>
                   <div 
                     className={`text-sm font-bold cursor-help hover:underline ${getComplexityColor(formatRiskLevel(flight.originAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity), isDarkMode)}`}
                     onMouseEnter={(e) => handleMouseEnter(e, flight.departure.airport.code, true, false)}
                     onMouseLeave={handleMouseLeave}
                   >
                     {flight.departure.airport.code}
                   </div>
                   <div className={`text-xs flex items-center justify-center gap-1 ${getWeatherRiskColor(formatRiskLevel(flight.originAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk), isDarkMode)}`}>
                     <span>{flight.departure.airport.city}</span>
                     <button
                       onClick={() => handleAirportClick(
                         flight.departure.airport.code,
                         flight.departure.airport.name || `${flight.departure.airport.code} Airport`,
                         flight.departure.airport.city
                       )}
                       className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                         isDarkMode 
                           ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                           : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                       }`}
                       title={`View ${flight.departure.airport.code} on 3D Map`}
                     >
                       <MapPin className="w-2.5 h-2.5" />
                       <span>Map</span>
                     </button>
                   </div>
               </div>
              
               {/* Check if this is a direct flight or has connections */}
               {flight.connections && flight.connections.length > 0 ? (
                 // Flight with connections - show all segments and layovers
                 <>
                   {flight.connections.map((connection, index) => {
                     // FIXED: Use the actual layover duration from layoverInfo, not the flight segment duration
                     const layoverDuration = connection.layoverInfo?.duration || '0m';
                     console.log(`🔍 Layover ${index + 1} data:`, {
                       layoverInfo: connection.layoverInfo,
                       duration: connection.layoverInfo?.duration,
                       durationType: typeof connection.layoverInfo?.duration,
                       formatted: formatLayoverDuration(layoverDuration)
                     });
                     
                     return (
                       <React.Fragment key={connection.id}>
                         {/* Flight segment line with duration and arrow */}
                         <div className="flex flex-col items-center relative flex-1 min-w-0">
                             <div className={`text-xs mb-1 font-medium text-center ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                               <span className="mr-1">✈️</span>
                               {formatDuration(getSegmentDurationInMinutes(connection.duration))}
                           </div>
                           <div className="relative flex items-center justify-center w-full overflow-visible">
                             <div className="h-1 bg-blue-400" style={{width: 'calc(100% + 16px)'}}></div>
                           </div>
                             <div className={`text-xs mt-1 text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                             <TranslatedText text="Travel Time" targetLanguage={currentLanguage} />
                           </div>
                         </div>
                        
                         {/* Layover stop - only show if this segment has layover info */}
                         {connection.layoverInfo && (
                           <div className="flex flex-col items-center relative flex-shrink-0 z-10">
                             <div className="text-xs text-center m-0 p-0 mb-1">
                                 <div className={`font-medium m-0 p-0 ${getLayoverTextColor(flight)}`}>
                                   {getLayoverStatus(flight) === 'Connection Risk' && (
                                   <span className="text-sm mr-1">🚨</span>
                                 )}
                                   {getLayoverStatus(flight) === 'Reasonable Layover' && (
                                   <span className="text-sm mr-1">🟡</span>
                                 )}
                                   {getLayoverStatus(flight) === 'Plenty of Time' && (
                                   <span className="text-sm mr-1">🟢</span>
                                 )}
                                   <TranslatedText text={getLayoverStatus(flight)} targetLanguage={currentLanguage} />
                               </div>
                             </div>
                             {/* Layover text positioned in the middle of blue line */}
                               <div className={`text-xs font-bold mb-0.5 text-center ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                                 <span className="mr-1">⏱️</span>
                               <TranslatedText text={`Layover ${index + 1}`} targetLanguage={currentLanguage} />
                             </div>
                             {/* Layover time positioned above blue line like segment durations */}
                             <div className={`text-xs mb-0.5 font-medium text-center ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                               {/* FIXED: Display the actual layover duration, not the flight segment duration */}
                               {formatLayoverDuration(layoverDuration)}
                             </div>
                             {/* Layover gap - no blue line here */}
                             <div className="h-1 mb-0.5"></div>
                             <div className="text-xs text-center m-0 p-0">
                               <div 
                                 className={`font-bold m-0 p-0 mb-0.5 cursor-help hover:underline ${getComplexityColor(formatRiskLevel(connection.layoverInfo?.airport_complexity?.complexity || 'medium'), isDarkMode)}`}
                                 onMouseEnter={(e) => handleMouseEnter(e, connection.layoverInfo?.airport || '', false, false)}
                                 onMouseLeave={handleMouseLeave}
                               >
                                 {connection.layoverInfo?.airport}
                               </div>
                               <div className={`m-0 p-0 text-xs flex items-center justify-center gap-1 ${getWeatherRiskColor(formatRiskLevel(connection.layoverInfo?.weather_risk?.level || 'medium'), isDarkMode)}`}>
                                 <span>{connection.layoverInfo?.city}</span>
                                 {connection.layoverInfo && (
                                   <button
                                     onClick={() => handleAirportClick(
                                       connection.layoverInfo!.airport,
                                       `${connection.layoverInfo!.airport} Airport`,
                                       connection.layoverInfo!.city
                                     )}
                                     className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                                       isDarkMode 
                                         ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                                         : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                     }`}
                                     title={`View ${connection.layoverInfo!.airport} on 3D Map`}
                                   >
                                     <MapPin className="w-2.5 h-2.5" />
                                     <span>Map</span>
                                   </button>
                                 )}
                               </div>
                             </div>
                           </div>
                         )}
                       </React.Fragment>
                     );
                   })}
                  
                     {/* Final segment from last layover to destination */}
                   {flight.finalSegmentTravelTime && (
                     <div className="flex flex-col items-center relative flex-1 min-w-0">
                         <div className={`text-xs mb-1 font-medium text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                           <span className="mr-1">✈️</span>
                           {formatDuration(getSegmentDurationInMinutes(flight.finalSegmentTravelTime))}
                       </div>
                       <div className="relative flex items-center justify-center w-full overflow-visible">
                         <div className="h-1 bg-blue-400" style={{width: 'calc(100% + 16px)'}}></div>
                       </div>
                         <div className={`text-xs mt-1 text-center relative z-10 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                           <TranslatedText text="Travel Time" targetLanguage={currentLanguage} />
                         </div>
                       </div>
                     )}
                     
                     {/* Final segment from last layover to destination - only show if we have finalSegmentTravelTime */}
                     {flight.finalSegmentTravelTime && (
                       <div className="flex flex-col items-center relative flex-1 min-w-0">
                         <div className={`text-xs mb-1 font-medium text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                           <span className="mr-1">✈️</span>
                           {formatDuration(getSegmentDurationInMinutes(flight.finalSegmentTravelTime))}
                       </div>
                       <div className="relative flex items-center justify-center w-full overflow-visible">
                         <div className="h-1 bg-blue-400" style={{width: 'calc(100% + 16px)'}}></div>
                       </div>
                         <div className={`text-xs mt-1 text-center relative z-10 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                           <TranslatedText text="Travel Time" targetLanguage={currentLanguage} />
                         </div>
                       </div>
                     )}
                 </>
               ) : (
                 // Direct flight - show single flight segment
                 <div className="flex flex-col items-center relative flex-1 min-w-0">
                     <div className={`text-xs mb-1 font-medium text-center relative z-10 ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                       <span className="mr-1">✈️</span>
                       {formatDuration(getSegmentDurationInMinutes(flight.duration))}
                   </div>
                   <div className="relative flex items-center justify-center w-full overflow-visible">
                     <div className="h-1 bg-blue-400" style={{width: 'calc(100% + 16px)'}}></div>
                   </div>
                     <div className={`text-xs mt-1 text-center relative z-10 ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>
                     <TranslatedText text="Travel Time" targetLanguage={currentLanguage} />
                   </div>
                 </div>
               )}
              
               {/* Arrival time */}
               <div className="flex-shrink-0 text-center relative z-10">
                   <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{formatTimeWithAMPM(flight.arrival.time)}</div>
                   <div 
                     className={`text-sm font-bold cursor-help hover:underline ${getComplexityColor(formatRiskLevel(flight.destinationAnalysis?.airport_complexity?.complexity || flight.riskFactors.airportComplexity), isDarkMode)}`}
                     onMouseEnter={(e) => handleMouseEnter(e, flight.arrival.airport.code, false, true)}
                     onMouseLeave={handleMouseLeave}
                   >
                     {flight.arrival.airport.code}
                   </div>
                   <div className={`text-xs flex items-center justify-center gap-1 ${getWeatherRiskColor(formatRiskLevel(flight.destinationAnalysis?.weather_risk?.level || flight.riskFactors.weatherRisk), isDarkMode)}`}>
                     <span>{flight.arrival.airport.city}</span>
                     <button
                       onClick={() => handleAirportClick(
                         flight.arrival.airport.code,
                         flight.arrival.airport.name || `${flight.arrival.airport.code} Airport`,
                         flight.arrival.airport.city
                       )}
                       className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${
                         isDarkMode 
                           ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' 
                           : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                       }`}
                       title={`View ${flight.arrival.airport.code} on 3D Map`}
                     >
                       <MapPin className="w-2.5 h-2.5" />
                       <span>Map</span>
                     </button>
                   </div>
                 </div>
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Risk factors */}
     <div className="mb-4">
         <div className={`flex items-center space-x-4 text-sm mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-600'}`}>
           <span>
             <span className="font-bold"><TranslatedText text="Cancellation:" targetLanguage={currentLanguage} /></span> {flight.riskFactors.cancellationRate !== undefined ? `${flight.riskFactors.cancellationRate}%` : 'Analysis failed'}
           </span>
         <span>
             <span className="font-bold"><TranslatedText text="Delay Probability:" targetLanguage={currentLanguage} /></span> {flight.riskFactors.delayProbability !== undefined ? `${flight.riskFactors.delayProbability}%` : 'Analysis failed'}
         </span>
         <span>
             <span className="font-bold"><TranslatedText text="Weather:" targetLanguage={currentLanguage} /></span> <TranslatedText text={formatRiskLevel(calculateHighestWeatherRisk(flight))} targetLanguage={currentLanguage} />
         </span>
         <span>
             <span className="font-bold"><TranslatedText text="Airport:" targetLanguage={currentLanguage} /></span> <TranslatedText text={formatRiskLevel(calculateHighestAirportComplexity(flight))} targetLanguage={currentLanguage} />
         </span>
       </div>
       {flight.riskFactors.seasonalFactors.length > 0 && (
         <div className="flex flex-wrap gap-1">
             {flight.riskFactors.seasonalFactors.slice(0, 3).map((factor, index) => (
               <span key={index} className={`inline-block px-2 py-1 text-xs rounded ${
                 isDarkMode ? 'bg-slate-600 text-slate-200' : 'bg-slate-100 text-slate-600'
               }`}>
               <TranslatedText text={factor} targetLanguage={currentLanguage} />
             </span>
           ))}
         </div>
       )}
     </div>

     {/* Bottom section with price and insurance */}
       <div className={`flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-slate-600' : 'border-slate-200'}`}>
       <div className="flex items-center space-x-4">
         <div>
             <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>${flight.price}</p>
             <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
             <TranslatedText text="per person" targetLanguage={currentLanguage} />
           </p>
         </div>
         <div className="text-left">
             <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
             <TranslatedText text="Insurance:" targetLanguage={currentLanguage} />
           </p>
           <p className={`text-sm font-medium ${insurance.color}`}>
             {insurance.icon} <TranslatedText text={insurance.text} targetLanguage={currentLanguage} />
           </p>
         </div>
       </div>

       <button
         onClick={() => onSelect(flight)}
         className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
       >
         <TranslatedText
           text={isExpanded ? 'Hide Details' : 'View Details'}
           targetLanguage={currentLanguage}
         />
       </button>
     </div>
   </div>

     {/* Custom Tooltip */}
     {tooltip.visible && (
       <div
         className={`fixed z-50 pointer-events-none rounded-lg shadow-lg p-3 max-w-xs ${
           isDarkMode 
             ? 'bg-slate-800 border border-slate-600 shadow-slate-900/50 text-slate-100' 
             : 'bg-white border border-gray-200 shadow-gray-900/20 text-slate-900'
         }`}
         style={{
           left: tooltip.x,
           top: tooltip.y,
         }}
         dangerouslySetInnerHTML={{ __html: tooltip.content }}
       />
     )}

     {/* Airport Location Viewer Modal */}
     {selectedAirport && (
       <AirportLocationViewer
         isOpen={!!selectedAirport}
         onClose={closeAirportMap}
         airportCode={selectedAirport.code}
         airportName={selectedAirport.name}
         airportCity={selectedAirport.city}
         complexity={selectedAirport.complexity}
         description={selectedAirport.description}
       />
     )}
   </>
 );
};