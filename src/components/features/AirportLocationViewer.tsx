import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Building, Star } from 'lucide-react';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { useDarkMode } from '../../context/DarkModeContext';

interface AirportLocationViewerProps {
  isOpen: boolean;
  onClose: () => void;
  airportCode: string;
  airportName: string;
  airportCity: string;
  complexity: string;
  description: string;
}

// Google Maps API type declarations
declare global {
  interface Window {
    google: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>;
        Map: any;
        Marker: any;
        MapTypeId: any;
        Size: any;
        Point: any;
        // 3D Tiles specific types
        Map3DElement: any;
        Marker3DElement: any;
      };
    };
  }
}

const AirportLocationViewer: React.FC<AirportLocationViewerProps> = ({
  isOpen,
  onClose,
  airportCode,
  airportName,
  airportCity,
  complexity,
  description
}) => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const isInitializingRef = useRef(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'3D' | '2D' | 'Info'>('3D');

  // Get airport coordinates
  const getAirportCoordinates = (code: string): { lat: number; lng: number } | null => {
    const airportData: { [key: string]: { lat: number; lng: number } } = {
      'ATL': { lat: 33.6407, lng: -84.4277 },
      'LAX': { lat: 33.9416, lng: -118.4085 },
      'ORD': { lat: 41.9786, lng: -87.9048 },
      'DFW': { lat: 32.8968, lng: -97.0380 },
      'DEN': { lat: 39.8561, lng: -104.6737 },
      'JFK': { lat: 40.6413, lng: -73.7781 },
      'SFO': { lat: 37.6213, lng: -122.3790 },
      'CLT': { lat: 35.2144, lng: -80.9473 },
      'LAS': { lat: 36.0840, lng: -115.1537 },
      'PHX': { lat: 33.4342, lng: -112.0116 },
      'MIA': { lat: 25.7932, lng: -80.2906 },
      'IAH': { lat: 29.9902, lng: -95.3368 },
      'MCO': { lat: 28.4312, lng: -81.3081 },
      'EWR': { lat: 40.6895, lng: -74.1745 },
      'MSP': { lat: 44.8848, lng: -93.2223 },
      'DTW': { lat: 42.2162, lng: -83.3554 },
      'BOS': { lat: 42.3656, lng: -71.0096 },
      'PHL': { lat: 39.8729, lng: -75.2437 },
      'LGA': { lat: 40.7769, lng: -73.8740 },
      'FLL': { lat: 26.0742, lng: -80.1506 },
      'BWI': { lat: 39.1754, lng: -76.6682 },
      'IAD': { lat: 38.9531, lng: -77.4565 },
      'MDW': { lat: 41.7868, lng: -87.7522 },
      'DCA': { lat: 38.8512, lng: -77.0402 },
      'HNL': { lat: 21.3245, lng: -157.9251 },
      'PDX': { lat: 45.5898, lng: -122.5951 },
      'CLE': { lat: 41.4117, lng: -81.8498 },
      'PIT': { lat: 40.4915, lng: -80.2329 },
      'STL': { lat: 38.7487, lng: -90.3700 },
      'BNA': { lat: 36.1263, lng: -86.6774 },
      'RDU': { lat: 35.8801, lng: -78.7880 },
      'IND': { lat: 39.7169, lng: -86.2956 },
      'MCI': { lat: 39.2976, lng: -94.7139 },
      'AUS': { lat: 30.1975, lng: -97.6664 },
      'CVG': { lat: 39.0489, lng: -84.6678 },
      'JAX': { lat: 30.4941, lng: -81.6879 },
      'CHS': { lat: 32.8986, lng: -80.0405 },
      'RSW': { lat: 26.5362, lng: -81.7552 },
      'MSY': { lat: 29.9934, lng: -90.2580 },
      'SAT': { lat: 29.5337, lng: -98.4698 },
      'MKE': { lat: 42.9476, lng: -87.8966 },
      'PBI': { lat: 26.6832, lng: -80.0956 },
      'TUS': { lat: 32.1161, lng: -110.9410 },
      'ABQ': { lat: 35.0402, lng: -106.6091 },
      'BOI': { lat: 43.5644, lng: -116.2228 },
      'TUL': { lat: 36.1984, lng: -95.8881 },
      'OMA': { lat: 41.3025, lng: -95.8941 },
      'OKC': { lat: 35.3931, lng: -97.6007 },
      'BUF': { lat: 42.9405, lng: -78.7322 },
      'RIC': { lat: 37.5052, lng: -77.3197 },
      'GRR': { lat: 42.8808, lng: -85.5228 },
      'PNS': { lat: 30.4734, lng: -87.1866 },
      'BHM': { lat: 33.5629, lng: -86.7535 },
      'SYR': { lat: 43.1112, lng: -76.1063 },
      'ROC': { lat: 43.1189, lng: -77.6724 },
      'GSP': { lat: 34.8957, lng: -82.2189 },
      'DAY': { lat: 39.9024, lng: -84.2194 },
      'DSM': { lat: 41.5340, lng: -93.6631 },
      'CRW': { lat: 38.3731, lng: -81.5932 },
      'LEX': { lat: 38.0365, lng: -84.6059 },
      'LIT': { lat: 34.7294, lng: -92.2243 },
      'MEM': { lat: 35.0424, lng: -89.9767 },
      'PVD': { lat: 41.7242, lng: -71.4282 },
      'SDF': { lat: 38.1744, lng: -85.7360 },
      'XNA': { lat: 36.2819, lng: -94.3068 },
      'BTR': { lat: 30.5332, lng: -91.1496 },
      'ELP': { lat: 31.8073, lng: -106.3776 },
      'FSD': { lat: 43.5820, lng: -96.7419 },
      'GEG': { lat: 47.6199, lng: -117.5338 },
      'ICT': { lat: 37.6499, lng: -97.4331 },
      'JAN': { lat: 32.3112, lng: -90.0759 },
      'LBB': { lat: 33.6636, lng: -101.8228 },
      'MSN': { lat: 43.1399, lng: -89.3375 },
      'ORF': { lat: 36.8945, lng: -76.2012 },
      'PWM': { lat: 43.6462, lng: -70.3087 },
      'RNO': { lat: 39.4993, lng: -119.7681 },
      'SAV': { lat: 32.1276, lng: -81.2020 },
      'SGF': { lat: 37.2457, lng: -93.3886 },
      'SHV': { lat: 32.4466, lng: -93.8256 },
      'TLH': { lat: 30.3965, lng: -84.3503 },
      'TYS': { lat: 35.8109, lng: -83.9940 },
      'ALB': { lat: 42.7483, lng: -73.8017 },
      'AMA': { lat: 35.2194, lng: -101.7059 },
      'ANC': { lat: 61.1744, lng: -149.9963 },
      'BDL': { lat: 41.9389, lng: -72.6832 },
      'BIS': { lat: 46.7727, lng: -100.7460 },
      'BUR': { lat: 34.2006, lng: -118.3585 },
      'CAK': { lat: 40.9163, lng: -81.4425 },
      'CID': { lat: 41.8847, lng: -91.7108 },
      'COS': { lat: 38.8058, lng: -104.7008 },
      'DAL': { lat: 32.8471, lng: -96.8518 },
      'FAR': { lat: 46.9207, lng: -96.8158 },
      'FAT': { lat: 36.7762, lng: -119.7181 },
      'GJT': { lat: 39.1224, lng: -108.5267 },
      'GPT': { lat: 30.4073, lng: -89.0701 },
      'GRB': { lat: 44.4851, lng: -88.1296 },
      'GSO': { lat: 36.0978, lng: -79.9373 },
      'GYY': { lat: 41.6163, lng: -87.4128 },
      'HOU': { lat: 29.6454, lng: -95.2789 },
      'HPN': { lat: 41.0670, lng: -73.7076 },
      'HSV': { lat: 34.6372, lng: -86.7751 },
      'ISP': { lat: 40.7952, lng: -73.1002 },
      'LGB': { lat: 33.8177, lng: -118.1516 },
      'MAF': { lat: 31.9425, lng: -102.2019 },
      'MHT': { lat: 42.9326, lng: -71.4357 },
      'MOB': { lat: 30.6912, lng: -88.2428 },
      'MYR': { lat: 33.6797, lng: -78.9283 },
      'OAK': { lat: 37.7214, lng: -122.2208 },
      'OGG': { lat: 20.8986, lng: -156.4305 },
      'ONT': { lat: 34.0559, lng: -117.6011 },
      'PFN': { lat: 30.2121, lng: -85.6828 },
      'PIA': { lat: 40.6642, lng: -89.6933 },
      'PIE': { lat: 27.9106, lng: -82.6874 },
      'RFD': { lat: 42.1954, lng: -89.0972 },
      'ROA': { lat: 37.3255, lng: -79.9754 },
      'SBN': { lat: 41.7083, lng: -86.3173 },
      'SCE': { lat: 40.8493, lng: -77.8486 },
      'SJC': { lat: 37.3639, lng: -121.9289 },
      'SNA': { lat: 33.6762, lng: -117.8677 },
      'SRQ': { lat: 27.3954, lng: -82.5544 },
      'SWF': { lat: 41.5041, lng: -74.1048 },
      'VPS': { lat: 30.4832, lng: -86.5254 }
    };

    return airportData[code] || null;
  };

  // Geocode airport by name using Google Geocoding API
  const geocodeAirportByName = async (airportName: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      console.log('🔍 Geocoding airport by name:', airportName);
      
      // Add "airport" to the search term for better results
      const searchTerm = `${airportName} airport`;
      
      // Use Google Geocoding API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchTerm)}&key=AIzaSyB9jxCpFclGwigqmjBZkam0OfRipy8x5sw`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        console.log('✅ Geocoding successful:', location);
        return { lat: location.lat, lng: location.lng };
      } else {
        console.warn('⚠️ Geocoding failed:', data.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Geocoding error:', error);
      return null;
    }
  };

  // Get coordinates with fallback to geocoding
  const getCoordinates = async (input: string): Promise<{ lat: number; lng: number } | null> => {
    // First try: Direct coordinate lookup
    const coords = getAirportCoordinates(input);
    if (coords) {
      console.log('📍 Found coordinates in database for:', input);
      return coords;
    }
    
    // Fallback: Geocoding for unknown airports
    console.log('🔍 Airport not in database, trying geocoding for:', input);
    return await geocodeAirportByName(input);
  };

  // Get complexity color
  const getComplexityColor = (complexity: string): string => {
    switch (complexity.toLowerCase()) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Initialize map
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const initializeMap = async () => {
      if (isInitializingRef.current) {
        console.log('🔄 Map initialization already in progress');
        return;
      }

      try {
        isInitializingRef.current = true;
        setIsLoading(true);
        setError(null);

        console.log('🔄 Starting Google Maps 3D Tiles initialization...');

        // Get coordinates using the new function that supports both database and geocoding
        const coords = await getCoordinates(airportCode);
        if (!coords) {
          console.error('❌ Could not find coordinates for airport:', airportCode);
          setError('Airport location not found');
          setMapType('Info');
          return;
        }

        console.log('📍 Using coordinates:', coords);

        // Check if Google Maps is available
        if (!window.google || !window.google.maps) {
          console.log('❌ Google Maps not available, showing fallback');
          setError('Google Maps API not available');
          setMapType('Info');
          return;
        }

        // Try to import the maps3d library first
        try {
          const { Map3DElement, Marker3DElement } = await window.google.maps.importLibrary("maps3d") as any;
          const { PinElement } = await window.google.maps.importLibrary("marker") as any;

          if (mapContainerRef.current && isMounted && !mapInstanceRef.current) {
            // Clear container
            mapContainerRef.current.innerHTML = '';

            // Create 3D map element with better configuration
            const map3DElement = document.createElement('gmp-map-3d');
            map3DElement.setAttribute('mode', 'hybrid');
            map3DElement.setAttribute('center', `${coords.lat}, ${coords.lng}, 300`);
            map3DElement.setAttribute('range', '1500');
            map3DElement.setAttribute('tilt', '45');
            map3DElement.setAttribute('heading', '0');
            map3DElement.style.width = '100%';
            map3DElement.style.height = '100%';
            map3DElement.style.minHeight = '400px';

            // Store reference and append to container
            mapInstanceRef.current = map3DElement;
            mapContainerRef.current.appendChild(map3DElement);

            // Wait for map to be ready with timeout
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('Map initialization timeout'));
              }, 10000); // 10 second timeout

              const checkReady = () => {
                if (map3DElement.isConnected) {
                  clearTimeout(timeout);
                  resolve(true);
                } else {
                  setTimeout(checkReady, 200);
                }
              };
              checkReady();
            });

            // Add airport marker after map is ready
            try {
              const pin = new PinElement({
                background: "#4285F4",
                borderColor: "#1967D2",
                glyphColor: "white",
                glyph: "✈️",
                scale: 2.0
              });

              const marker = new Marker3DElement({
                position: { lat: coords.lat, lng: coords.lng, altitude: 150 },
                altitudeMode: 'RELATIVE_TO_GROUND',
                title: `${airportName} (${airportCode})`
              });

              marker.append(pin);
              map3DElement.appendChild(marker);

              console.log('✅ Google Maps 3D Tiles initialized successfully');
              setMapType('3D');
            } catch (markerError) {
              console.warn('⚠️ Marker creation failed, but map loaded:', markerError);
              setMapType('3D');
            }
          }
        } catch (maps3dError) {
          console.warn('❌ 3D Maps not available, falling back to 2D map:', maps3dError);
          await initialize2DMap(coords);
        }
      } catch (error) {
        console.error('❌ Error initializing Google Maps:', error);
        setError(error instanceof Error ? error.message : 'Failed to load map');
        setMapType('Info');
      } finally {
        setIsLoading(false);
        isInitializingRef.current = false;
      }
    };

    const initialize2DMap = async (coords: { lat: number; lng: number }) => {
      try {
        console.log('🗺️ Initializing 2D map fallback...');
        
        // Import regular maps library
        const { Map } = await window.google.maps.importLibrary("maps") as any;
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker") as any;
        
        if (mapContainerRef.current && isMounted && !mapInstanceRef.current) {
          // Clear the container first
          mapContainerRef.current.innerHTML = '';
          
          // Create regular 2D map
          const map = new Map(mapContainerRef.current, {
            center: coords,
            zoom: 15,
            mapId: "DEMO_MAP_ID",
            mapTypeId: window.google.maps.MapTypeId.HYBRID,
            tilt: 45
          });
          
          mapInstanceRef.current = map;
          console.log('✅ 2D Map initialized successfully');
          
          // Add airport marker
          const pin = new PinElement({
            background: "#4285F4",
            borderColor: "#1967D2",
            glyphColor: "white",
            glyph: "✈️",
            scale: 1.5
          });

          const marker = new AdvancedMarkerElement({
            map: map,
            position: coords,
            content: pin.element,
            title: `${airportName} (${airportCode})`
          });

          marker.append(pin);
        }
      } catch (error) {
        console.error('❌ Failed to initialize 2D map:', error);
        setError('Failed to load map');
        setMapType('Info');
      }
    };

    // Only try to initialize once
    initializeMap();

    // Cleanup function
    return () => {
      isMounted = false;
      isInitializingRef.current = false;
      
      // Clean up map instance
      if (mapInstanceRef.current && mapContainerRef.current) {
        try {
          if (mapInstanceRef.current.parentNode === mapContainerRef.current) {
            mapContainerRef.current.removeChild(mapInstanceRef.current);
          }
        } catch (error) {
          console.log('Map cleanup error:', error);
        }
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [isOpen, airportCode, airportName, airportCity, complexity, description]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`relative w-full max-w-4xl max-h-[90vh] mx-4 rounded-lg shadow-2xl overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-3">
            <Building className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
            <div>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {airportName} ({airportCode})
              </h2>
              <div className="flex items-center space-x-2">
                <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {airportCity}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                    4.2/5
                  </span>
                  <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    User Rating
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-opacity-80 transition-colors ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-slate-200'}`}
          >
            <X className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
        </div>

        {/* Navigation Bar */}
        <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-100 text-red-800'}`}>
              Complexity: <span className={getComplexityColor(complexity)}>{complexity.toUpperCase()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
              <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <TranslatedText text="Airport Location" targetLanguage={currentLanguage} />
              </span>
            </div>
            <div className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800'}`}>
              Search: {airportCode}
            </div>
          </div>
          <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Google Maps 3D Tiles • FlightRiskRadar
          </div>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative">
          <div 
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ minHeight: '300px' }}
          >
            {isLoading && (
              <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
                  <p className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                    <TranslatedText text="Loading 3D Tiles..." targetLanguage={currentLanguage} />
                  </p>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    🗺️ Loading Google Maps 3D Tiles View
                  </p>
                </div>
              </div>
            )}
            
            {error && (
              <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-center">
                  <div className="text-red-500 text-4xl mb-4">⚠️</div>
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    <TranslatedText text="Map Unavailable" targetLanguage={currentLanguage} />
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {error}
                  </p>
                  <button
                    onClick={() => setMapType('Info')}
                    className={`mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                  >
                    <TranslatedText text="Show Airport Information" targetLanguage={currentLanguage} />
                  </button>
                </div>
              </div>
            )}

            {/* Fallback Airport Info */}
            {mapType === 'Info' && !isLoading && !error && (
              <div className={`flex flex-col items-center justify-center h-full p-6 text-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-6xl mb-4">✈️</div>
                <h3 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {airportName} ({airportCode})
                </h3>
                <p className={`text-lg mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {airportCity}
                </p>
                <div className={`px-4 py-2 rounded-lg mb-4 ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-700' : 'bg-blue-100 text-blue-800'}`}>
                  <strong>Coordinates:</strong> Loading...
                </div>
                <div className={`px-4 py-2 rounded-lg mb-4 ${isDarkMode ? 'bg-orange-900/20 text-orange-300 border border-orange-700' : 'bg-orange-100 text-orange-800'}`}>
                  <strong>Complexity:</strong> {complexity.toUpperCase()}
                </div>
                <p className={`text-sm max-w-md ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {description}
                </p>
              </div>
            )}

            {/* 3D Map Loading Message */}
            {mapType === '3D' && !isLoading && !error && (
              <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-center">
                  <div className="text-4xl mb-4">🗺️</div>
                  <h3 className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Google Maps 3D Tiles
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    Loading Photorealistic 3D view for {airportName}
                  </p>
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    If the 3D view doesn't appear, it may not be available for this location
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'bg-slate-700 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <p className="mb-2">
              <span className={`font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <TranslatedText text="Airport Description:" targetLanguage={currentLanguage} />
              </span>
            </p>
            <p className={`leading-relaxed ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AirportLocationViewer;