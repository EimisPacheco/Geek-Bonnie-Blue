import React, { useState, useEffect } from 'react';
import {
  Search,
  Star,
  BarChart3,
  ChevronDown,
  Loader2,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { flightRiskAPI, AirlineAnalysisResponse } from '../services/api';

interface Airline {
  code: string;
  name: string;
  logo: string;
  rating: number;
  totalFlights: number;
  onTimeRate: number;
  avgDelay: number;
  cancellationRate: number;
  delayProbability?: number;
  performanceCategory?: string;
  delayCategory?: string;
  marketShare?: number;
  performanceScore?: number;
  sentiment: string;
  // Detailed metrics from Cloud Function
  delayed_departures?: number;
  delayed_arrivals?: number;
  cancelled_flights?: number;
  diverted_flights?: number;
}

export const AirlineAnalyticsPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [selectedAirline, setSelectedAirline] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoute, setSelectedRoute] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('6months');
  const [sortBy, setSortBy] = useState<string>('performance');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [realData, setRealData] = useState<AirlineAnalysisResponse | null>(null);

  // Load real data from BigQuery
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await flightRiskAPI.getAirlinePerformanceAnalysis();
        setRealData(data);
      } catch (err) {
        setError('Failed to load airline performance data');
        console.error('Error loading airline data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Use real data or show error message
  const airlines = realData?.airlines?.map(airline => ({
    code: airline.code,
    name: airline.name,
    logo: `https://www.gstatic.com/flights/airline_logos/70px/${airline.code}.png`, // Use Google Flights airline logos
    rating: 3.8, // Placeholder, needs real rating
    totalFlights: airline.total_flights,
    onTimeRate: airline.on_time_rate,
    avgDelay: airline.avg_delay,
    cancellationRate: airline.cancellation_rate,
    delayProbability: airline.delay_probability,
    performanceCategory: airline.performance_category,
    delayCategory: airline.delay_category,
    marketShare: airline.market_share,
    performanceScore: airline.performance_score,
    sentiment: 'positive', // Placeholder, needs real sentiment
    // Add the detailed metrics from the Cloud Function
    delayed_departures: airline.delayed_departures,
    delayed_arrivals: airline.delayed_arrivals,
    cancelled_flights: airline.cancelled_flights,
    diverted_flights: airline.diverted_flights
  })) || [];

  // If no real data available and not loading, show honest message
  if (!loading && (!realData || !realData.airlines || realData.airlines.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
            <TranslatedText text="Airline Performance Data Unavailable" targetLanguage={currentLanguage} />
          </h2>
          <p className={`text-lg mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            <TranslatedText text="We're unable to load real-time airline performance data at the moment. This could be due to a temporary connection issue or the data service being unavailable." targetLanguage={currentLanguage} />
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <TranslatedText text="Try Again" targetLanguage={currentLanguage} />
          </button>
        </div>
      </div>
    );
  }

  const popularRoutes = [
    { route: 'JFK-LAX', airline: 'AA', avgDelay: 18.2, cancellationRate: 2.5, delayProbability: 45, rating: 3.9 },
    { route: 'ORD-DFW', airline: 'AA', avgDelay: 14.8, cancellationRate: 1.9, delayProbability: 35, rating: 4.1 },
    { route: 'ATL-LAX', airline: 'DL', avgDelay: 12.3, cancellationRate: 1.6, delayProbability: 35, rating: 4.2 },
    { route: 'LAX-EWR', airline: 'UA', avgDelay: 16.7, cancellationRate: 2.9, delayProbability: 45, rating: 3.7 },
    { route: 'MDW-BWI', airline: 'SW', avgDelay: 9.8, cancellationRate: 1.2, delayProbability: 25, rating: 4.4 },
    { route: 'BOS-FLL', airline: 'B6', avgDelay: 11.5, cancellationRate: 1.8, delayProbability: 35, rating: 4.0 }
  ];



  const sentimentData = [
    { category: 'Customer Service', positive: 65, neutral: 25, negative: 10 },
    { category: 'On-Time Performance', positive: 58, neutral: 30, negative: 12 },
    { category: 'Comfort & Cleanliness', positive: 72, neutral: 20, negative: 8 },
    { category: 'Value for Money', positive: 45, neutral: 35, negative: 20 },
    { category: 'Food & Beverage', positive: 38, neutral: 42, negative: 20 }
  ];

  const filteredAirlines = airlines.filter(airline =>
    airline.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airline.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate performance score for sorting (higher is better)
  const getPerformanceScore = (airline: Airline) => {
    const onTimeScore = airline.onTimeRate / 100; // 0-1 scale
    const delayScore = Math.max(0, 1 - (airline.avgDelay / 30)); // 0-1 scale, 30min = 0
    const cancellationScore = Math.max(0, 1 - (airline.cancellationRate / 5)); // 0-1 scale, 5% = 0
    const ratingScore = airline.rating / 5; // 0-1 scale
    
    return (onTimeScore * 0.3 + delayScore * 0.25 + cancellationScore * 0.25 + ratingScore * 0.2);
  };

  // Sort airlines based on selected criteria
  const sortedAirlines = [...filteredAirlines].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return getPerformanceScore(b) - getPerformanceScore(a);
      case 'onTime':
        return b.onTimeRate - a.onTimeRate;
      case 'delay':
        return a.avgDelay - b.avgDelay;
      case 'cancellation':
        return a.cancellationRate - b.cancellationRate;
      case 'rating':
        return b.rating - a.rating;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return getPerformanceScore(b) - getPerformanceScore(a);
    }
  });



  const getPerformanceColor = (value: number, threshold: number, reverse = false) => {
    const isGood = reverse ? value <= threshold : value >= threshold;
    return isGood 
      ? isDarkMode ? 'text-green-400' : 'text-green-600'
      : isDarkMode ? 'text-red-400' : 'text-red-600';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText text="Loading airline performance data..." targetLanguage={currentLanguage} />
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <TranslatedText text="Retry" targetLanguage={currentLanguage} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`py-16 relative overflow-hidden ${isDarkMode ? 'bg-slate-800/80 backdrop-blur-md' : 'bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700'}`}>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/723240/pexels-photo-723240.jpeg')] bg-cover bg-center opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="Airline Analytics" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Comprehensive airline performance data to help you make informed travel decisions" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`p-6 rounded-xl border shadow-md ${
            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search airlines by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDarkMode 
                        ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                        : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                    }`}
                  />
                </div>
              </div>
              
                             <div className="flex gap-4">
                 <select
                   value={selectedRoute}
                   onChange={(e) => setSelectedRoute(e.target.value)}
                   className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                     isDarkMode 
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'border-slate-300 bg-white text-slate-900'
                   }`}
                 >
                   <option value="all">All Routes</option>
                   <option value="domestic">Domestic</option>
                   <option value="international">International</option>
                 </select>
                 
                 <select
                   value={timeRange}
                   onChange={(e) => setTimeRange(e.target.value)}
                   className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                     isDarkMode 
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'border-slate-300 bg-white text-slate-900'
                   }`}
                 >
                   <option value="3months">Last 3 Months</option>
                   <option value="6months">Last 6 Months</option>
                   <option value="1year">Last Year</option>
                 </select>

                 <select
                   value={sortBy}
                   onChange={(e) => setSortBy(e.target.value)}
                   className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                     isDarkMode 
                       ? 'bg-slate-700 border-slate-600 text-white'
                       : 'border-slate-300 bg-white text-slate-900'
                   }`}
                 >
                   <option value="performance">Best Performance</option>
                   <option value="onTime">On-Time Rate</option>
                   <option value="delay">Lowest Delay</option>
                   <option value="cancellation">Lowest Cancellation</option>
                   <option value="rating">Highest Rating</option>
                   <option value="name">Alphabetical</option>
                 </select>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Airline Performance Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Airline Performance Overview" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Compare airlines based on historical performance data" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

                     <div className="grid gap-6">
             {sortedAirlines.map((airline) => (
              <div
                key={airline.code}
                className={`p-6 rounded-xl border shadow-lg transition-all duration-300 cursor-pointer relative ${
                  selectedAirline === airline.code
                    ? isDarkMode 
                      ? 'bg-slate-700/50 border-blue-500 shadow-xl shadow-blue-500/20 backdrop-blur-sm' 
                      : 'bg-blue-50 border-blue-300 shadow-xl'
                    : isDarkMode 
                      ? 'bg-slate-800/80 border-slate-600 hover:bg-slate-700/90 hover:border-slate-500 backdrop-blur-sm' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
                onClick={() => setSelectedAirline(selectedAirline === airline.code ? '' : airline.code)}
              >
                {/* Expand indicator arrow */}
                <div className={`absolute bottom-3 right-3 p-2 rounded-full transition-all duration-300 shadow-md ${
                  selectedAirline === airline.code
                    ? 'rotate-180 bg-blue-500 text-white shadow-blue-500/50'
                    : isDarkMode
                    ? 'bg-slate-700/80 text-slate-300 hover:bg-slate-600/80 backdrop-blur-sm'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center shadow-md ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600' 
                        : 'bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200'
                    }`}>
                      <img 
                        src={airline.logo} 
                        alt={airline.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                      <div className={`hidden w-full h-full flex items-center justify-center ${
                        isDarkMode 
                          ? 'bg-gradient-to-br from-slate-700 to-slate-800 text-blue-300' 
                          : 'bg-gradient-to-br from-slate-100 to-slate-200 text-blue-600'
                      }`}>
                        <span className="text-lg font-bold">{airline.code}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold flex items-center gap-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {airline.name}
                        {/* Trend indicator */}
                        {realData?.trends && realData.trends[airline.code] && (
                          <span className={`flex items-center ml-2 font-bold ${realData.trends[airline.code].trend_direction === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                            {realData.trends[airline.code].trend_direction === 'improving' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                            {realData.trends[airline.code].trend_direction === 'improving' ? '+' : ''}{realData.trends[airline.code].trend_percentage}%
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Code: {airline.code}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      User Rating
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                        {airline.rating}/5
                      </span>
                      <Star className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                    </div>
                  </div>
                </div>

                                 <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                   <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                     <div className={`text-2xl font-bold ${getPerformanceColor(airline.onTimeRate, 80)}`}>
                       {airline.onTimeRate}%
                     </div>
                     <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                       On-Time Rate
                     </div>
                   </div>
                   
                   <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                     <div className={`text-2xl font-bold ${getPerformanceColor(airline.avgDelay, 15, true)}`}>
                       {airline.avgDelay}m
                     </div>
                     <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                       Avg Delay
                     </div>
                   </div>

                   <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                     <div className={`text-2xl font-bold ${getPerformanceColor(airline.delayProbability || (airline.avgDelay > 15 ? 45 : 35), 40)}`}>
                       {airline.delayProbability || (airline.avgDelay > 15 ? 45 : airline.avgDelay > 10 ? 35 : 25)}%
                     </div>
                     <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                       Delay Probability
                     </div>
                   </div>
                   
                   <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                     <div className={`text-2xl font-bold ${getPerformanceColor(airline.cancellationRate, 2, true)}`}>
                       {airline.cancellationRate}%
                     </div>
                     <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                       Cancellation Rate
                     </div>
                   </div>
                   
                   <div className="text-center p-3 rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-700/50">
                     <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                       {airline.totalFlights.toLocaleString()}
                     </div>
                     <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                       Total Flights
                     </div>
                   </div>
                 </div>



                {selectedAirline === airline.code && (
                  <div className="border-t pt-6 space-y-6">
                    {/* Popular Routes */}
                    <div>
                      <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Popular Routes Performance" targetLanguage={currentLanguage} />
                      </h4>
                      <div className="grid gap-3">
                        {popularRoutes.filter(route => route.airline === airline.code).map((route, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                          }`}>
                            <div className="flex justify-between items-center">
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {route.route}
                              </span>
                              <div className="flex items-center space-x-4 text-sm">
                                <span className={getPerformanceColor(route.avgDelay, 15, true)}>
                                  {route.avgDelay}m delay
                                </span>
                                <span className={getPerformanceColor(route.delayProbability, 40)}>
                                  {route.delayProbability}% delay prob
                                </span>
                                <span className={getPerformanceColor(route.cancellationRate, 2, true)}>
                                  {route.cancellationRate}% cancelled
                                </span>
                                <div className="flex items-center">
                                  <Star className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                                  <span className="ml-1">{route.rating}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sentiment Analysis */}
                    <div>
                      <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Customer Sentiment Analysis" targetLanguage={currentLanguage} />
                      </h4>
                      <div className="grid gap-3">
                        {sentimentData.map((item, index) => (
                          <div key={index} className={`p-3 rounded-lg ${
                            isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                          }`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                {item.category}
                              </span>
                            </div>
                            <div className="flex h-2 rounded overflow-hidden">
                              <div className="bg-green-500" style={{ width: `${item.positive}%` }}></div>
                              <div className="bg-yellow-500" style={{ width: `${item.neutral}%` }}></div>
                              <div className="bg-red-500" style={{ width: `${item.negative}%` }}></div>
                            </div>
                            <div className="flex justify-between text-xs mt-1">
                              <span className="text-green-600">{item.positive}% Positive</span>
                              <span className="text-yellow-600">{item.neutral}% Neutral</span>
                              <span className="text-red-600">{item.negative}% Negative</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Trends Section */}
      {realData?.trends && Object.keys(realData.trends).length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                <TranslatedText text="Performance Trends" targetLanguage={currentLanguage} />
              </h2>
              <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                <TranslatedText 
                  text="Track airline performance changes over time" 
                  targetLanguage={currentLanguage} 
                />
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(realData.trends).map(([airlineCode, trend]) => (
                <div
                  key={airlineCode}
                  className={`p-6 rounded-xl border shadow-md ${
                    isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      {airlineCode}
                    </h3>
                    <div className={`flex items-center space-x-2 ${
                      trend.trend_direction === 'improving' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {trend.trend_direction === 'improving' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {trend.trend_direction === 'improving' ? '+' : ''}{trend.trend_percentage}%
                      </span>
                    </div>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-50'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Current Delay Rate
                      </span>
                      <span className={`font-semibold ${
                        trend.current_delay_rate < 30 ? 'text-green-600' : 
                        trend.current_delay_rate < 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {trend.current_delay_rate}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Previous Delay Rate
                      </span>
                      <span className={`font-semibold ${
                        trend.previous_delay_rate < 30 ? 'text-green-600' : 
                        trend.previous_delay_rate < 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {trend.previous_delay_rate}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Last 3 months
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}; 