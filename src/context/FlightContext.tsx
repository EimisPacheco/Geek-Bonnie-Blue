import React, { createContext, useContext, useState, ReactNode } from 'react';
import { extractCityFromAirportCode } from '../utils/airportsData';
// Removed serpApiService import as we now use Cloud Function directly

// Cache interface for storing Cloud Function results
interface CacheEntry {
  data: any;
  timestamp: number;
  expiresAt: number;
}

interface FlightCache {
  [key: string]: CacheEntry;
}

// Cache utility functions
const generateCacheKey = (params: any, searchType: 'route' | 'direct'): string => {
  if (searchType === 'direct') {
    return `direct_${params.airline}_${params.flightNumber}_${params.date}`;
  } else {
    return `route_${params.origin}_${params.destination}_${params.departureDate}_${params.returnDate || 'oneway'}_${params.passengers}`;
  }
};

const isCacheValid = (entry: CacheEntry): boolean => {
  const now = Date.now();
  return now < entry.expiresAt;
};

const getCacheExpiryTime = (): number => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to midnight
  return tomorrow.getTime();
};

const getCachedResult = (cacheKey: string): any | null => {
  try {
    const cache: FlightCache = JSON.parse(localStorage.getItem('flightRiskCache') || '{}');
    const entry = cache[cacheKey];
    
    if (entry && isCacheValid(entry)) {
      console.log('🎯 Cache HIT: Using cached result for', cacheKey);
      return entry.data;
    } else if (entry) {
      console.log('⏰ Cache EXPIRED: Removing expired cache for', cacheKey);
      delete cache[cacheKey];
      localStorage.setItem('flightRiskCache', JSON.stringify(cache));
    }
    
    console.log('❌ Cache MISS: No valid cache found for', cacheKey);
    return null;
  } catch (error) {
    console.error('❌ Cache error:', error);
    return null;
  }
};

const setCachedResult = (cacheKey: string, data: any): void => {
  try {
    const cache: FlightCache = JSON.parse(localStorage.getItem('flightRiskCache') || '{}');
    const expiresAt = getCacheExpiryTime();
    
    cache[cacheKey] = {
      data,
      timestamp: Date.now(),
      expiresAt
    };
    
    localStorage.setItem('flightRiskCache', JSON.stringify(cache));
    console.log('💾 Cache SAVED: Stored result for', cacheKey, 'expires at', new Date(expiresAt).toLocaleString());
  } catch (error) {
    console.error('❌ Cache save error:', error);
  }
};

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
}

export interface Flight {
  id: string;
  airline: string;
  flightNumber: string;
  aircraft: string;
  departure: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  arrival: {
    airport: Airport;
    time: string;
    terminal?: string;
    gate?: string;
  };
  duration: string;
  price: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: {
    overallRisk?: string;
    delayProbability?: number;
    cancellationRate?: number;
    weatherRisk: string;
    airportComplexity: string;
    connectionTime?: number;
    connectionType: string;
    connectionRisk: string;
    historicalDelays: number;
    seasonalFactors: string[];
    keyRiskFactors?: string[];
  };
  connections?: Flight[];
  layoverInfo?: {
    airport: string;
    airport_name: string;
    city: string;
    duration: string;
    arrival_time?: string;
    departure_time?: string;
    weather_risk?: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity?: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  connectionAnalysis?: {
    connection_number: number;
    airport: string;
    city: string;
    duration: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      connection_risk: string;
      connection_note: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  originAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  destinationAnalysis?: {
    airport: string;
    type: string;
    weather_risk: {
      level: string;
      description: string;
      reasoning?: string;
    };
    airport_complexity: {
      complexity: string;
      description: string;
      concerns: string[];
      reasoning?: string;
    };
  };
  insurance_recommendation?: {
    success: boolean;
    recommendation: string;
    recommendation_type: 'skip_insurance' | 'consider_insurance' | 'strongly_recommend' | 'neutral';
    risk_level: string;
    risk_score?: number;
    confidence: 'high' | 'medium' | 'low';
  };
  finalSegmentTravelTime?: string;
  connection_analysis?: {
    connection_details: Array<{
      connection_number: number;
      airport: string;
      city: string;
      duration: string;
      weather_risk: {
        level: string;
        description: string;
        reasoning?: string;
      };
      airport_complexity: {
        complexity: string;
        description: string;
        reasoning?: string;
        concerns: string[];
      };
    }>;
    overall_risk: string;
    total_connections: number;
  };
  adkStatus?: {
    implementation: 'real' | 'mock';
    description: string;
    framework: string;
  };
  on_time_rate?: number;
  on_time_data?: {
    airline_code: string;
    years_analyzed: number[];
    total_flights_analyzed: number;
    on_time_rate: number;
    performance_metrics: {
      cancellation_rate: number;
      diversion_rate: number;
      delay_rate: number;
      severe_delay_rate: number;
      avg_departure_delay_minutes: number;
      avg_arrival_delay_minutes: number;
    };
    delay_breakdown: {
      carrier_delay: number;
      weather_delay: number;
      nas_delay: number;
      security_delay: number;
      late_aircraft_delay: number;
    };
    data_reliability: string;
    query_timestamp: string;
  };
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
  tripType: 'oneWay' | 'roundTrip';
}

export interface DirectFlightParams {
  airline: string;
  flightNumber: string;
  date: string;
}

interface FlightContextType {
  searchParams: SearchParams | null;
  directFlightParams: DirectFlightParams | null;
  flights: Flight[];
  selectedFlight: Flight | null;
  isLoading: boolean;
  searchType: 'route' | 'direct' | null;
  error: string | null;
  setSearchParams: (params: SearchParams) => void;
  searchFlights: (params: SearchParams) => void;
  searchDirectFlight: (params: DirectFlightParams) => void;
  selectFlight: (flight: Flight) => void;
  clearError: () => void;
}

const FlightContext = createContext<FlightContextType | undefined>(undefined);

// Export the hook properly for Fast Refresh compatibility
export const useFlightContext = () => {
  const context = useContext(FlightContext);
  if (!context) {
    throw new Error('useFlightContext must be used within a FlightProvider');
  }
  return context;
};

// Helper function to parse duration strings like "8h 24m" to minutes
const parseDurationToMinutes = (duration: string | number): number => {
  if (typeof duration === 'number') {
    return duration;
  }
  
  const durationStr = String(duration);
  if (durationStr.includes('h') || durationStr.includes('m')) {
    // Parse "8h 24m" format
    const hours = durationStr.match(/(\d+)h/);
    const minutes = durationStr.match(/(\d+)m/);
    return (hours ? parseInt(hours[1]) * 60 : 0) + (minutes ? parseInt(minutes[1]) : 0);
  } else {
    // Assume it's minutes as a number
    return Number(durationStr) || 0;
  }
};

// Helper function to calculate connection risk based on layover duration (matches Cloud Function logic)
const calculateConnectionRisk = (layoverDurationMinutes: number): 'low' | 'medium' | 'high' => {
  if (layoverDurationMinutes < 45) {
    return 'high';      // "Connection Risk" - 🚨
  } else if (layoverDurationMinutes < 360) {  // Less than 6 hours
    return 'medium';    // "Reasonable Layover" - 🟡
  } else {  // 6+ hours
    return 'low';       // "Plenty of Time" - 🟢
  }
};

export const FlightProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [directFlightParams, setDirectFlightParams] = useState<DirectFlightParams | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'route' | 'direct' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debug loading state changes
  React.useEffect(() => {
    console.log('🔄 LOADING STATE CHANGED:', isLoading);
  }, [isLoading]);

  const searchFlights = (params: SearchParams) => {
    console.log('🔥 SEARCHFLIGHTS FUNCTION CALLED!');
    console.log('🚀 STARTING ROUTE SEARCH - LOOKING FOR CONNECTIONS');
    console.log('🔍 SEARCH PARAMS:', params);
    
    // Validate required parameters
    if (!params.origin || !params.destination || !params.departureDate) {
      console.error('❌ MISSING REQUIRED PARAMS:', { origin: params.origin, destination: params.destination, date: params.departureDate });
      setError('Missing required search parameters');
      return;
    }
    
    // Clear any existing data and errors
    setFlights([]);
    setError(null);
    setIsLoading(true);
    setSearchType('route');
    setSearchParams(params);
    
    // Use setTimeout to ensure loading state is visible
    setTimeout(async () => {
      const startTime = Date.now();
      
      try {
        // Check cache first
        const cacheKey = generateCacheKey(params, 'route');
        const cachedResult = getCachedResult(cacheKey);
        
        if (cachedResult) {
          console.log('🎯 Using cached result for route search');
          setFlights(cachedResult.flights || []);
          setIsLoading(false);
          return;
        }
        
        console.log('📡 CALLING CLOUD FUNCTION FOR ROUTE SEARCH...');
        const response = await fetch('https://flight-risk-analysis-pppgnpgaqq-uc.a.run.app/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // Use LEGACY ROUTE PARAMETERS format - same as working direct API test
            origin: params.origin,
            destination: params.destination,
            date: params.departureDate, // Note: 'date' not 'departure_date' 
            trip_type: params.tripType === 'oneWay' ? 'one-way' : 'round-trip'
          }),
        });
        console.log('📡 CLOUD FUNCTION RESPONSE STATUS:', response.status);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }

        if (!result.flights || !Array.isArray(result.flights)) {
          throw new Error('Invalid response format: missing flights array');
        }

        // Process each flight through the Cloud Function for AI analysis
        const processedFlights = result.flights.map((flight: Record<string, unknown>, index: number) => {
          console.log(`🔍 DEBUG - Processing flight ${index + 1}:`, {
            airline: flight.airline,
            flightNumber: flight.flight_number,
            riskAnalysis: flight.risk_analysis,
            delayProbability: flight.risk_analysis?.delay_probability,
            cancellationProbability: flight.risk_analysis?.cancellation_probability
          });
          
          // Log weather analysis type for React console
          try {
            const travelDate = params.departureDate;
            const travelDateTime = new Date(travelDate);
            const today = new Date();
            const daysAhead = Math.ceil((travelDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysAhead > 7) {
              console.log(`🌤️ REACT CONSOLE: Weather analysis for flight ${index + 1} - SEASONAL analysis (flight is ${daysAhead} days from today)`);
            } else {
              console.log(`🌤️ REACT CONSOLE: Weather analysis for flight ${index + 1} - REAL-TIME SerpAPI analysis (flight is ${daysAhead} days from today)`);
            }
          } catch (e) {
            console.log(`⚠️ REACT CONSOLE: Could not determine weather analysis type for flight ${index + 1}:`, e);
          }
          
          return convertCloudFunctionFlightToOurFormat(flight, index, result.adk_status, result.weather_analysis);
        }).filter(Boolean);

        if (processedFlights.length === 0) {
          throw new Error('Failed to process any flights');
        }

        // Sort flights by price (cheapest first)
        const sortedFlights = processedFlights.sort((a, b) => a.price - b.price);
        
        setFlights(sortedFlights);
        
        // Save to cache for future requests
        const cacheKeyForSaving = generateCacheKey(params, 'route');
        setCachedResult(cacheKeyForSaving, { flights: sortedFlights });
        
      } catch (error) {
        console.error('❌ SEARCH ERROR:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to search flights';
        
        // Better error message for rate limiting
        if (errorMessage.includes('No flights found') || errorMessage.includes('rate limit') || errorMessage.includes('429')) {
          setError('SerpAPI rate limit exceeded. Please upgrade your SerpAPI plan or try again later. Visit https://serpapi.com/dashboard to check your usage.');
        } else {
          setError(errorMessage);
        }
        setFlights([]);
      } finally {
        // Ensure minimum loading time of 2 seconds for better UX
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000; // 2 seconds
        
        if (elapsedTime < minLoadingTime) {
          const remainingTime = minLoadingTime - elapsedTime;
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
    setIsLoading(false);
      }
    }, 0);
  };

  const convertCloudFunctionFlightToOurFormat = (flight: Record<string, unknown>, index: number, adkStatus?: Flight['adkStatus'], weatherAnalysis?: Record<string, unknown>, seasonalFactors?: string[], keyRiskFactors?: string[]): Flight | null => {
    try {
      console.log(`🔍 DEBUG - Starting convertCloudFunctionFlightToOurFormat for flight ${index}`);
      console.log(`🔍 DEBUG - Flight data keys:`, Object.keys(flight));
      console.log(`🔍 DEBUG - Weather analysis keys:`, weatherAnalysis ? Object.keys(weatherAnalysis) : 'none');
      
      // Extract times - use the already formatted times from cloud function
      const originTime = String(flight.departure_time_local || flight.departure_time || '');
      const destinationTime = String(flight.arrival_time_local || flight.arrival_time || '');
      
      // Extract risk data from risk_analysis
      const riskAssessment = flight.risk_analysis as Record<string, unknown>;
      const delayProbability = riskAssessment?.delay_probability ? 
        parseFloat(String(riskAssessment.delay_probability).split('%')[0]) : undefined;
      const cancellationRate = riskAssessment?.cancellation_probability ? 
        parseFloat(String(riskAssessment.cancellation_probability).split('%')[0]) : undefined;
      
      // Extract seasonal factors and key risk factors from the response
      const extractedSeasonalFactors = seasonalFactors && Array.isArray(seasonalFactors) ? seasonalFactors :
        (riskAssessment?.seasonal_factors && Array.isArray(riskAssessment.seasonal_factors) ? riskAssessment.seasonal_factors : 
        (keyRiskFactors && Array.isArray(keyRiskFactors) ? keyRiskFactors : []));
      
      const extractedKeyRiskFactors = keyRiskFactors && Array.isArray(keyRiskFactors) ? keyRiskFactors :
        (riskAssessment?.key_risk_factors && Array.isArray(riskAssessment.key_risk_factors) ? riskAssessment.key_risk_factors : 
        (seasonalFactors && Array.isArray(seasonalFactors) ? seasonalFactors : []));
      
      // DEBUG: Log the extracted data
      console.log('🔍 DEBUG - Extracted data:', {
        delayProbability,
        cancellationRate,
        extractedSeasonalFactors,
        extractedKeyRiskFactors,
        riskAssessment: riskAssessment
      });
      
      // For direct flights, weather data is in weatherAnalysis parameter, not flight.weather_info
      const originWeather = weatherAnalysis?.origin_weather as Record<string, unknown>;
      const destinationWeather = weatherAnalysis?.destination_weather as Record<string, unknown>;
      
      // Extract airport codes and cities - use flight_data fields for direct flights
      const originCode = String(flight.origin_airport_code || flight.origin || originWeather?.airport_code || 'Unknown');
      const destinationCode = String(flight.destination_airport_code || flight.destination || destinationWeather?.airport_code || 'Unknown');
      const originCity = String(originWeather?.city || extractCityFromAirportCode(originCode));
      const destinationCity = String(destinationWeather?.city || extractCityFromAirportCode(destinationCode));
      const originAirportName = String(originWeather?.airport_name || `${originCity} Airport`);
      const destinationAirportName = String(destinationWeather?.airport_name || `${destinationCity} Airport`);
      
      // Extract price from flight data
      const price = Number(flight.price_usd || flight.price || 0);
      
      // Extract flight segments from the flights array (from SerpAPI structure)
      const flightSegments = flight.flights as Array<Record<string, unknown>>;
      
      // Extract connection information from backend
      const backendConnections = flight.connections as Array<Record<string, unknown>>;
      const layovers = flight.layovers as Array<Record<string, unknown>>;
      const hasConnections = (layovers && layovers.length > 0) || (backendConnections && backendConnections.length > 0);
      
      // Build connections array for flights with layovers
      let connections: Flight[] | undefined = undefined;
      let finalSegmentTravelTime: string | undefined = undefined;
      
      // First check if backend already provided connections
      if (backendConnections && backendConnections.length > 0) {
        // Use the connections directly from backend
        connections = backendConnections.map((conn, index) => ({
          id: `connection-${index}`,
          airline: String(flight.airline_name || flight.airline || 'Unknown'),
          flightNumber: String(flight.flight_number || 'Unknown'),
          aircraft: String(flight.airplane_model || flight.aircraft_type || 'Unknown'),
          departure: {
            airport: {
              code: String(conn.departure?.airport?.code || conn.airport_code || conn.airport || 'Unknown'),
              name: String(conn.departure?.airport?.name || conn.airport_name || `${String(conn.city || 'Unknown')} Airport`),
              city: String(conn.departure?.airport?.city || conn.city || 'Unknown'),
              country: 'United States'
            },
            time: String(conn.departure?.time || conn.departure_time || '00:00')
          },
          arrival: {
            airport: {
              code: String(conn.arrival?.airport?.code || conn.airport_code || conn.airport || 'Unknown'),
              name: String(conn.arrival?.airport?.name || conn.airport_name || `${String(conn.city || 'Unknown')} Airport`),
              city: String(conn.arrival?.airport?.city || conn.city || 'Unknown'),
              country: 'United States'
            },
            time: String(conn.arrival?.time || conn.arrival_time || '00:00')
          },
          duration: String(conn.duration || conn.travel_time || '0m'),
          price: 0,
          riskScore: 0,
          riskLevel: 'medium' as const,
          riskFactors: {
            weatherRisk: 'medium',
            airportComplexity: 'medium',
            connectionTime: Number(conn.layoverInfo?.duration || 0),
            connectionType: 'connecting',
            connectionRisk: 'medium',
            historicalDelays: 0,
            seasonalFactors: [],
            keyRiskFactors: []
          },
          layoverInfo: conn.layoverInfo ? {
            airport: String(conn.layoverInfo.airport || ''),
            airport_name: String(conn.layoverInfo.airport_name || `${String(conn.layoverInfo.city || 'Unknown')} Airport`),
            city: String(conn.layoverInfo.city || 'Unknown'),
            duration: String(conn.layoverInfo.duration || ''),
            arrival_time: String(conn.layoverInfo.arrival_time || ''),
            departure_time: String(conn.layoverInfo.departure_time || ''),
            weather_risk: conn.layoverInfo.weather_risk as Record<string, unknown>,
            airport_complexity: conn.layoverInfo.airport_complexity as Record<string, unknown>
          } : undefined
        }));
      } else if (hasConnections && flightSegments && Array.isArray(flightSegments)) {
        // For flights with connections, create connection objects based on flight segments
        connections = flightSegments.map((segment, segmentIndex) => {
          const segmentData = segment as Record<string, unknown>;
          const arrivalAirport = segmentData.arrival_airport as Record<string, unknown>;
          const departureAirport = segmentData.departure_airport as Record<string, unknown>;
          
          const segmentAirport = String(arrivalAirport.id || 'Unknown');
          const segmentCity = String(arrivalAirport.city || extractCityFromAirportCode(segmentAirport));
          const segmentAirportName = String(arrivalAirport.name || `${segmentCity} Airport`);
          
          // Get the correct segment duration for this specific segment
          const segmentDuration = Number(segmentData.duration || 0);
          const segmentDurationFormatted = `${Math.floor(segmentDuration / 60)}h ${segmentDuration % 60}m`;
          
          // Find corresponding layover for this segment (layover occurs at the arrival airport of this segment)
          const correspondingLayover = layovers && layovers.length > 0 ? 
            layovers.find(layover => 
              String(layover.airport_code || layover.airport || layover.id) === segmentAirport
            ) : null;
          
          // ALSO check the backend connections array for weather/airport data
          const backendConnections = flight.connections as Array<Record<string, unknown>> || [];
          const correspondingConnection = backendConnections.find(conn => 
            String(conn.airport || conn.airport_code || conn.id) === segmentAirport
          );
          
          console.log(`🔍 MAPPING DEBUG for ${segmentAirport}:`);
          console.log('- correspondingLayover:', correspondingLayover);
          console.log('- correspondingConnection:', correspondingConnection);
          console.log('- correspondingConnection.weather_risk:', correspondingConnection?.weather_risk);
          console.log('- correspondingConnection.airport_complexity:', correspondingConnection?.airport_complexity);
          
          // Handle layover duration - use the helper function for consistency
          let layoverDurationMinutes = 0;
          if (correspondingLayover && correspondingLayover.duration) {
            layoverDurationMinutes = parseDurationToMinutes(correspondingLayover.duration);
            console.log(`🔍 DEBUG: Parsed layover duration "${correspondingLayover.duration}" to ${layoverDurationMinutes} minutes`);
          } else if (correspondingConnection && (correspondingConnection as any).layoverInfo && (correspondingConnection as any).layoverInfo.duration) {
            // FIXED: Look for layover duration in the layoverInfo object, not the connection duration
            layoverDurationMinutes = parseDurationToMinutes((correspondingConnection as any).layoverInfo.duration);
            console.log(`🔍 DEBUG: Parsed layover duration "${(correspondingConnection as any).layoverInfo.duration}" to ${layoverDurationMinutes} minutes`);
          }
          
          const connectionRiskLevel = layoverDurationMinutes > 0 ? calculateConnectionRisk(layoverDurationMinutes) : 'low';
          console.log(`🔍 DEBUG: Connection risk for ${layoverDurationMinutes} minutes: ${connectionRiskLevel}`);
          
          const layoverDurationFormatted = layoverDurationMinutes > 0 ? 
            `${Math.floor(layoverDurationMinutes / 60)}h ${layoverDurationMinutes % 60}m` : undefined;
          
          return {
            id: `connection-${index}-${segmentIndex}`,
            airline: String(segmentData.airline || flight.airline_name || flight.airline || 'Unknown'),
            flightNumber: String(segmentData.flight_number || `${String(segmentData.airline || 'XX')}${segmentIndex + 1}`),
            aircraft: String(flight.airplane_model || flight.aircraft_type || 'Unknown'),
            departure: {
              airport: {
                code: String(departureAirport.id || 'Unknown'),
                name: String(departureAirport.name || `${String(departureAirport.city || extractCityFromAirportCode(String(departureAirport.id || 'Unknown')))} Airport`),
                city: String(departureAirport.city || extractCityFromAirportCode(String(departureAirport.id || 'Unknown'))),
                country: 'United States'
              },
              time: isSerpAPITimeFormat(String(departureAirport.time || flight.departure_time || '')) ? formatSerpAPITime(String(departureAirport.time || flight.departure_time || '')) : String(departureAirport.time || flight.departure_time || '')
            },
            arrival: {
              airport: {
                code: segmentAirport,
                name: segmentAirportName,
                city: segmentCity,
                country: 'United States'
              },
              time: isSerpAPITimeFormat(String(arrivalAirport.time || '')) ? formatSerpAPITime(String(arrivalAirport.time || '')) : String(arrivalAirport.time || '')
            },
            duration: segmentDurationFormatted, // Use the actual segment duration
            price: Number(flight.price || 0),
            riskScore: Number(riskAssessment?.overall_risk_score || 50),
            riskLevel: String(riskAssessment?.risk_level || 'medium') as 'low' | 'medium' | 'high',
            riskFactors: {
              overallRisk: String(riskAssessment?.risk_level || riskAssessment?.overall_risk),
              delayProbability: delayProbability,
              cancellationRate: cancellationRate,
              weatherRisk: String(originWeather?.flight_risk_assessment ? 
                (originWeather.flight_risk_assessment as Record<string, unknown>)?.overall_risk_level : 'medium'),
              airportComplexity: String(
                // Try to get airport complexity from weather analysis first
                (((weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
                (((weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
                // Fallback to flight-specific analysis
                (((flight.origin_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>))?.complexity ||
                (((flight.destination_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>))?.complexity ||
                // Final fallback
                'medium'
              ),
              connectionTime: hasConnections ? Number(layovers[0].duration || 0) : undefined,
              connectionType: hasConnections ? 'connecting' : 'direct',
              connectionRisk: hasConnections && layovers.length > 0 ? calculateConnectionRisk(parseDurationToMinutes(layovers[0].duration || '0')) : 'low',
              historicalDelays: parseFloat(String(riskAssessment?.historical_performance?.average_delay || '0 minutes').replace(' minutes', '')) || 0,
              seasonalFactors: extractedSeasonalFactors,
              keyRiskFactors: extractedKeyRiskFactors
            },
            layoverInfo: correspondingLayover ? {
              airport: String(correspondingLayover.airport || correspondingLayover.id || segmentAirport),
              airport_name: String(correspondingLayover.airport_name || correspondingLayover.name || segmentAirportName),
              city: String(correspondingLayover.city || segmentCity),
              duration: String(correspondingLayover.duration || '0m'),
              arrival_time: String(correspondingLayover.arrival_time || ''),
              departure_time: String(correspondingLayover.departure_time || ''),
              // FIXED: Use actual weather_risk and airport_complexity from Cloud Function
              weather_risk: (correspondingConnection?.weather_risk || correspondingLayover?.weather_risk || {
                level: 'medium',
                description: 'Weather analysis not available',
                reasoning: undefined
              }) as { level: string; description: string; reasoning?: string },
              airport_complexity: (correspondingConnection?.airport_complexity || correspondingLayover?.airport_complexity || {
                complexity: 'medium',
                description: 'Airport complexity analysis not available',
                concerns: ['Analysis not available'],
                reasoning: undefined
              }) as { complexity: string; description: string; concerns: string[]; reasoning?: string }
            } : undefined,
            // DEBUG: Log all available data
            ...((() => {
              console.log(`🔍 CONNECTION DEBUG for ${segmentAirport}:`);
              console.log('correspondingLayover:', correspondingLayover);
              console.log('correspondingConnection:', correspondingConnection);
              console.log('weather_risk sources:', {
                fromConnection: correspondingConnection?.weather_risk,
                fromLayover: correspondingLayover?.weather_risk
              });
              console.log('airport_complexity sources:', {
                fromConnection: correspondingConnection?.airport_complexity,
                fromLayover: correspondingLayover?.airport_complexity
              });
              return {};
            })())
          };
        });
        
        // No need for separate finalSegmentTravelTime since all segments are now in connections array
        console.log('🔍 DEBUG final_segment_travel_time_minutes:', {
          value: flight.final_segment_travel_time_minutes,
          type: typeof flight.final_segment_travel_time_minutes,
          truthy: Boolean(flight.final_segment_travel_time_minutes)
        });
        
        finalSegmentTravelTime = flight.final_segment_travel_time_minutes ? 
          `${Math.floor(Number(flight.final_segment_travel_time_minutes) / 60)}h ${Number(flight.final_segment_travel_time_minutes) % 60}m` : 
          undefined;
          
        console.log('🔍 DEBUG finalSegmentTravelTime result:', finalSegmentTravelTime);
      }
      
      const formattedFlight: Flight = {
        id: `cf-${index}-${Date.now()}`,
        airline: String(flight.airline_name || flight.airline || 'Unknown'),
        flightNumber: String(flight.flight_number || 'Unknown'),
        aircraft: String(flight.aircraft || flight.airplane_model || flight.aircraft_type || 'Unknown'),
        departure: {
          airport: {
            code: originCode,
            name: originAirportName,
            city: originCity,
            country: 'United States'
          },
          time: originTime
        },
        arrival: {
          airport: {
            code: destinationCode,
            name: destinationAirportName,
            city: destinationCity,
            country: 'United States'
          },
          time: destinationTime
        },
        duration: String(flight.duration || 'Unknown'),
        price: Number(flight.price_usd || flight.price || 0),
        riskScore: Number(riskAssessment?.overall_risk_score || 50),
        riskLevel: String(riskAssessment?.risk_level || 'medium') as 'low' | 'medium' | 'high',
        riskFactors: {
          overallRisk: String(riskAssessment?.risk_level || riskAssessment?.overall_risk),
          delayProbability: delayProbability,
          cancellationRate: cancellationRate,
          weatherRisk: String(originWeather?.flight_risk_assessment ? 
            (originWeather.flight_risk_assessment as Record<string, unknown>)?.overall_risk_level : 'medium'),
          airportComplexity: String(
            // Try to get airport complexity from weather analysis first
            (((weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
            (((weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>)?.complexity ||
            // Fallback to flight-specific analysis
            (((flight.origin_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>))?.complexity ||
            (((flight.destination_analysis as Record<string, unknown>)?.airport_complexity as Record<string, unknown>))?.complexity ||
            // Final fallback
            'medium'
          ),
          connectionTime: hasConnections ? Number(layovers[0].duration || 0) : undefined,
          connectionType: hasConnections ? 'connecting' : 'direct',
          connectionRisk: hasConnections && layovers.length > 0 ? calculateConnectionRisk(parseDurationToMinutes(layovers[0].duration || '0')) : 'low',
          historicalDelays: parseFloat(String(riskAssessment?.historical_performance?.average_delay || '0 minutes').replace(' minutes', '')) || 0,
          seasonalFactors: extractedSeasonalFactors,
          keyRiskFactors: extractedKeyRiskFactors
        },
        // Set connections for flights with layovers
        connections: connections,
        // Add layover information if present
        layoverInfo: hasConnections ? {
          airport: String(layovers[0].airport_code || layovers[0].airport || ''),
          airport_name: String(layovers[0].airport_name || `${String(layovers[0].city || extractCityFromAirportCode(String(layovers[0].airport_code || '')))} Airport`),
          city: String(layovers[0].city || extractCityFromAirportCode(String(layovers[0].airport_code || ''))),
          duration: String(layovers[0].duration || '0m'),
          arrival_time: String(layovers[0].arrival_time || ''),
          departure_time: String(layovers[0].departure_time || '')
        } : undefined,
        // Add enhanced connection analysis from Cloud Function
        connection_analysis: flight.connection_analysis as Flight['connection_analysis'],
        // Add origin and destination analysis from Cloud Function
        originAnalysis: (flight.origin_analysis || (weatherAnalysis as Record<string, unknown>)?.origin_airport_analysis) as Flight['originAnalysis'],
        destinationAnalysis: (flight.destination_analysis || (weatherAnalysis as Record<string, unknown>)?.destination_airport_analysis) as Flight['destinationAnalysis'],
        // Add AI-generated insurance recommendation
        insurance_recommendation: flight.insurance_recommendation as Flight['insurance_recommendation'],
        finalSegmentTravelTime: finalSegmentTravelTime || String(flight.final_segment_travel_time || ''),
        adkStatus: adkStatus,
        // Add On-Time Rate from Cloud Function
        on_time_rate: flight.on_time_rate as number | undefined,
        on_time_data: flight.on_time_data as Flight['on_time_data']
      };

      return formattedFlight;
      
    } catch (error) {
      console.error('❌ Error converting Cloud Function flight:', error);
      return null;
    }
  };

  // Helper function to detect if a time string is in SerpAPI format (YYYY-MM-DD HH:MM)
  const isSerpAPITimeFormat = (timeString: string): boolean => {
    return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(timeString);
  };

  const formatSerpAPITime = (timeString: string): string => {
    try {
      // SerpAPI returns time in format "2025-07-08 06:00"
      const [, time] = timeString.split(' ');
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minutes} ${ampm}`;
    } catch (error) {
      console.error('❌ Error formatting SerpAPI time:', error);
      return timeString;
    }
  };

  // Removed unused functions - now using Cloud Function directly



  const searchDirectFlight = (params: DirectFlightParams) => {
    console.log('🚀 SETTING LOADING STATE TO TRUE (DIRECT FLIGHT)');
    setIsLoading(true);
    setError(null);
    setSearchType('direct');
    setDirectFlightParams(params);
    
    // Check cache first
    const cacheKey = generateCacheKey(params, 'direct');
    const cachedResult = getCachedResult(cacheKey);
    
    if (cachedResult) {
      console.log('🎯 Using cached result for direct flight search');
      setFlights(cachedResult.flights || []);
      setIsLoading(false);
      return;
    }
    
    // Retry mechanism for specific error
    const callCloudFunctionWithRetry = async (retryCount = 0): Promise<any> => {
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second base delay
      
      try {
        console.log(`🔍 DIRECT FLIGHT SEARCH ATTEMPT ${retryCount + 1}/${maxRetries + 1}:`, params);
        console.log(`📊 Retry Status: ${retryCount === 0 ? 'Initial attempt' : `Retry #${retryCount}`}`);
        
        // Call the Cloud Function directly for BigQuery + AI analysis
        const cloudFunctionData = {
        airline: params.airline,
        flight_number: params.flightNumber,
          date: params.date
      };
      
        console.log('🤖 CALLING CLOUD FUNCTION for direct flight lookup:', cloudFunctionData);
        console.log(`⏱️ Request timestamp: ${new Date().toISOString()}`);
      
        const response = await fetch('https://flight-risk-analysis-pppgnpgaqq-uc.a.run.app/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify(cloudFunctionData)
      });
      
      if (!response.ok) {
          throw new Error(`Flight lookup failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('🎯 CLOUD FUNCTION RESULT:', result);
        console.log(`✅ SUCCESS on attempt ${retryCount + 1}!`);
        
        if (result.error) {
          // Check if this is the specific error we want to retry
          if (result.error.includes("'str' object has no attribute 'get'")) {
            console.log(`⚠️ RETRYABLE ERROR DETECTED: ${result.error}`);
            console.log(`🔄 Will retry due to: 'str' object has no attribute 'get' error`);
            throw new Error(`RETRYABLE_ERROR: ${result.error}`);
          }
          throw new Error(result.error);
        }
        
        // CRITICAL FIX: Check for success: false from Cloud Function
        if (result.success === false) {
          console.log('❌ Cloud Function returned success: false');
          console.log('🔍 DEBUG - Full result:', result);
          
          // Check if there's a specific error message in the result
          if (result.error) {
            throw new Error(result.error);
          } else if (result.message) {
            throw new Error(result.message);
          } else {
            throw new Error('Flight analysis failed: Cloud Function returned success: false');
          }
        }
        
        console.log(`🎉 FINAL SUCCESS: Cloud function completed successfully on attempt ${retryCount + 1}`);
        return result;
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Check if this is the specific retryable error
        if (errorMessage.includes("'str' object has no attribute 'get'") || errorMessage.includes('RETRYABLE_ERROR:')) {
          if (retryCount < maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
            console.log(`⚠️ Retryable error detected: ${errorMessage}`);
            console.log(`🔄 Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${maxRetries})`);
            console.log(`⏰ Next retry at: ${new Date(Date.now() + delay).toISOString()}`);
            console.log(`📈 Exponential backoff: ${baseDelay}ms → ${delay}ms (${Math.pow(2, retryCount)}x)`);
            
            await new Promise(resolve => setTimeout(resolve, delay));
            console.log(`🚀 Starting retry attempt ${retryCount + 2}...`);
            return callCloudFunctionWithRetry(retryCount + 1);
          } else {
            console.error(`❌ Max retries (${maxRetries}) reached for direct flight analysis`);
            console.log(`📊 Final retry summary:`);
            console.log(`   • Total attempts: ${maxRetries + 1}`);
            console.log(`   • All attempts failed with: 'str' object has no attribute 'get'`);
            console.log(`   • Total time spent: ~${(baseDelay * (Math.pow(2, maxRetries) - 1) / 1000).toFixed(1)}s`);
            throw new Error(`Direct flight analysis failed after ${maxRetries} retries: ${errorMessage}`);
          }
        } else {
          // Non-retryable error, throw immediately
          console.log(`❌ Non-retryable error detected: ${errorMessage}`);
          console.log(`🛑 Stopping retry attempts - this error will not be retried`);
          throw error;
        }
      }
    };
    
    // Use setTimeout to allow UI to update with loading state before heavy work
    setTimeout(async () => {
      const startTime = Date.now();
      try {
        const now = new Date().toLocaleString();
        console.log(`\n\n${'*'.repeat(60)}\n🚀🚀🚀 LOGS START [${now}] 🚀🚀🚀\nPARAMETERS:`, params, `\n${'*'.repeat(60)}\n`);
        const result = await callCloudFunctionWithRetry();
        
        console.log('🔍 DEBUG - Cloud Function Response Structure:', {
          hasConnectionAnalysis: !!result.connection_analysis,
          connectionAnalysisKeys: result.connection_analysis ? Object.keys(result.connection_analysis) : 'none',
          connectionDetails: result.connection_analysis?.connection_details,
          connectionDetailsLength: result.connection_analysis?.connection_details?.length,
          agentsUsed: result.agents_used || 'none',
          adkStatus: result.adk_status || 'none'
        });
        
        console.log('🔍 DEBUG - Weather Analysis Structure:', {
          hasWeatherAnalysis: !!result.weather_analysis,
          weatherAnalysisKeys: result.weather_analysis ? Object.keys(result.weather_analysis) : 'none',
          hasOriginWeather: !!result.weather_analysis?.origin_weather,
          hasDestinationWeather: !!result.weather_analysis?.destination_weather,
          flightDataKeys: Object.keys(result.flight_data || {}),
          hasFlightDataOriginWeather: !!result.flight_data?.origin_weather,
          hasFlightDataDestinationWeather: !!result.flight_data?.destination_weather
        });
        
        console.log('🔍 DEBUG - Risk Assessment Data:', {
          riskAssessment: result.risk_analysis,
          delayProbability: result.risk_analysis?.delay_probability,
          cancellationProbability: result.risk_analysis?.cancellation_probability,
          riskLevel: result.risk_analysis?.risk_level,
          overallRiskScore: result.risk_analysis?.overall_risk_score
        });
        
        console.log('🔍 DEBUG - Raw Risk Assessment Values:', {
          delayProbabilityType: typeof result.risk_analysis?.delay_probability,
          delayProbabilityValue: result.risk_analysis?.delay_probability,
          cancellationProbabilityType: typeof result.risk_analysis?.cancellation_probability,
          cancellationProbabilityValue: result.risk_analysis?.cancellation_probability,
          delayProbabilityIncludesFailed: result.risk_analysis?.delay_probability?.includes?.('Analysis failed'),
          cancellationProbabilityIncludesFailed: result.risk_analysis?.cancellation_probability?.includes?.('Analysis failed')
        });
        
        console.log(`🎯 DIRECT FLIGHT SEARCH COMPLETED SUCCESSFULLY!`);
        console.log(`📊 Search Summary:`);
        console.log(`   • Flight: ${params.airline} ${params.flightNumber}`);
        console.log(`   • Date: ${params.date}`);
        console.log(`   • Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
        console.log(`   • Retry mechanism: Active and working`);
        
        if (!result.flight_data) {
          throw new Error('Flight not found in our database');
        }
        
        // Add defensive error handling for weather data access
        try {
          console.log('🔍 DEBUG - Attempting to access weather data...');
        
        // Convert the Cloud Function response to our Flight format
        const flightData = result.flight_data;
        // AI analysis data is at the root level, not nested
        
        // Log weather analysis type for React console (direct flight)
        try {
          const travelDate = params.date;
          const travelDateTime = new Date(travelDate);
          const today = new Date();
          const daysAhead = Math.ceil((travelDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysAhead > 7) {
            console.log(`🌤️ REACT CONSOLE: Direct flight weather analysis - SEASONAL analysis (flight is ${daysAhead} days from today)`);
          } else {
            console.log(`🌤️ REACT CONSOLE: Direct flight weather analysis - REAL-TIME SerpAPI analysis (flight is ${daysAhead} days from today)`);
          }
        } catch (e) {
          console.log(`⚠️ REACT CONSOLE: Could not determine direct flight weather analysis type:`, e);
        }
        
          // ... rest of the existing code for converting flight data ...
          
          // Add the flight to the list
          const convertedFlight = convertCloudFunctionFlightToOurFormat(
            { ...flightData, risk_analysis: result.risk_analysis }, 
            0, 
            result.adk_status
          );
          if (convertedFlight) {
            setFlights([convertedFlight]);
            setSelectedFlight(convertedFlight);
            setSearchType('direct');
            setError(null);
            
            // Save to cache for future requests
            const cacheKeyForSaving = generateCacheKey(params, 'direct');
            setCachedResult(cacheKeyForSaving, { flights: [convertedFlight] });
          } else {
            throw new Error('Failed to convert flight data to display format');
          }
          
        } catch (weatherError) {
          console.error('❌ Weather data access error:', weatherError);
          console.log('🔍 DEBUG - Falling back to basic flight data conversion...');
          
          // Fallback: try to convert without weather data
          try {
            const flightData = result.flight_data;
            const convertedFlight = convertCloudFunctionFlightToOurFormat(flightData, 0, result.adk_status);
            if (convertedFlight) {
              setFlights([convertedFlight]);
              setSelectedFlight(convertedFlight);
              setSearchType('direct');
              setError(null);
              
              // Save to cache for future requests
              const cacheKeyForSaving = generateCacheKey(params, 'direct');
              setCachedResult(cacheKeyForSaving, { flights: [convertedFlight] });
            } else {
              throw new Error('Failed to convert flight data even in fallback mode');
            }
          } catch (fallbackError) {
            console.error('❌ Fallback conversion also failed:', fallbackError);
            setError(`Flight analysis failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
        }
        
      } catch (error) {
        console.error('❌ Direct flight search failed:', error);
        setError(error instanceof Error ? error.message : 'Failed to search direct flight');
        setFlights([]);
      } finally {
        const endNow = new Date().toLocaleString();
        console.log(`\n${'*'.repeat(60)}\n🏁🏁🏁 LOGS ENDS [${endNow}] 🏁🏁🏁\n${'*'.repeat(60)}\n\n`);
        // Ensure minimum loading time of 2 seconds for better UX
        const elapsedTime = Date.now() - startTime;
        const minLoadingTime = 2000; // 2 seconds
        
        if (elapsedTime < minLoadingTime) {
          const remainingTime = minLoadingTime - elapsedTime;
          console.log(`⏳ Adding ${remainingTime}ms delay to show loading screen (DIRECT FLIGHT)`);
          await new Promise(resolve => setTimeout(resolve, remainingTime));
        }
        
        console.log('🏁 SETTING LOADING STATE TO FALSE (DIRECT FLIGHT)');
        setIsLoading(false);
      }
    }, 0);
  };

  const formatBigQueryTime = (timeString: string): string => {
    try {
      if (!timeString) return '00:00';
      
      // Cloud Function now returns time in HH:MM format directly (like "10:50", "15:55")
      if (timeString.includes(':') && !timeString.includes('T') && !timeString.includes(' ')) {
        // Format like "10:50" or "15:55" - already in correct format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const min = parseInt(minutes || '0');
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      } else if (timeString.includes('T')) {
        // Fallback for ISO format like "2025-07-16T09:00:00"
        const date = new Date(timeString);
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      } else if (timeString.includes(' ')) {
        // Fallback for format like "2025-07-16 09:00:00"
        const [, time] = timeString.split(' ');
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const min = parseInt(minutes);
        return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
      }
      return timeString;
    } catch (error) {
      console.error('❌ Error formatting BigQuery time:', error);
      return timeString;
    }
  };

  const selectFlight = (flight: Flight) => {
    setSelectedFlight(flight);
  };

  const clearError = () => {
    setError(null);
  };



  return (
    <FlightContext.Provider
      value={{
        searchParams,
        directFlightParams,
        flights,
        selectedFlight,
        isLoading,
        searchType,
        error,
        setSearchParams,
        searchFlights,
        searchDirectFlight,
        selectFlight,
        clearError,
      }}
    >
      {children}
    </FlightContext.Provider>
  );
}; 