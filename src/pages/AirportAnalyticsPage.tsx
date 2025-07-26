import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plane, 
  Clock,
  Wind,
  Building,
  Users,
  AlertTriangle,
  ChevronDown,
  Loader2,
  XCircle,
  Info,
  Star
} from 'lucide-react';
import TranslatedText from '../components/TranslatedText';
import { useTranslation } from '../context/TranslationContext';
import { useDarkMode } from '../context/DarkModeContext';
import { flightRiskAPI, AirportAnalysisResponse } from '../services/api';

interface Airport {
  code: string;
  name: string;
  city: string;
  complexityScore: number;
  dailyFlights: number;
  terminals: number;
  runways: number;
  onTimeRate: number;
  avgDelay: number;
  cancellationRate: number;
  securityWaitTime: number;
  connectionEfficiency: number;
  weatherImpact: string;
  peakHours: string[];
  constructionStatus: string;
  dominantAirlines: string[];
  delayProbability?: number;
  performanceCategory?: string;
  complexityCategory?: string;
  marketShare?: number;
  efficiencyScore?: number;
  riskFactors?: string[];
  riskLevel?: string;
  rating?: number;
  sentiment?: string;
}

export const AirportAnalyticsPage: React.FC = () => {
  const { currentLanguage } = useTranslation();
  const { isDarkMode } = useDarkMode();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAirport, setSelectedAirport] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('complexity');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [realData, setRealData] = useState<AirportAnalysisResponse | null>(null);

  // Load real data from BigQuery
  useEffect(() => {
    const loadRealData = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await flightRiskAPI.getAirportPerformanceAnalysis();
        setRealData(data);
      } catch (err) {
        setError('Failed to load airport performance data');
        console.error('Error loading airport data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRealData();
  }, []);

  // Use real data or fallback to mock data
  const airports = realData?.airports?.map(airport => ({
    code: airport.code,
    name: `${airport.code} Airport`,
    city: airport.code,
    complexityScore: airport.complexity_score,
    dailyFlights: airport.total_departures,
    terminals: 4,
    runways: 3,
    onTimeRate: airport.on_time_rate,
    avgDelay: airport.avg_delay,
    cancellationRate: airport.cancellation_rate,
    delayProbability: airport.delay_probability,
    performanceCategory: airport.performance_category,
    complexityCategory: airport.complexity_category,
    marketShare: airport.market_share,
    efficiencyScore: airport.efficiency_score,
    riskFactors: airport.risk_factors,
    riskLevel: airport.risk_level,
    rating: 3.8, // Mock rating
    sentiment: 'positive',
    securityWaitTime: 25,
    connectionEfficiency: 65,
    weatherImpact: 'High',
    peakHours: ['6:00-9:00 AM', '4:00-7:00 PM'],
    constructionStatus: 'Ongoing terminal renovations',
    dominantAirlines: ['Delta', 'American', 'JetBlue']
  })) || [
    {
      code: 'JFK',
      name: 'John F. Kennedy International Airport',
      city: 'New York',
      complexityScore: 9.2,
      dailyFlights: 1250,
      terminals: 6,
      runways: 4,
      onTimeRate: 72.5,
      avgDelay: 18.3,
      cancellationRate: 3.2,
      delayProbability: 45,
      performanceCategory: 'Fair',
      complexityCategory: 'Very High',
      marketShare: 12.8,
      efficiencyScore: 58.2,
      riskFactors: ['Low on-time performance', 'High average delays', 'High cancellation rate', 'Very high complexity'],
      riskLevel: 'High',
      securityWaitTime: 25,
      connectionEfficiency: 65,
      weatherImpact: 'High',
      peakHours: ['6:00-9:00 AM', '4:00-7:00 PM'],
      constructionStatus: 'Ongoing terminal renovations',
      dominantAirlines: ['Delta', 'American', 'JetBlue'],
      rating: 3.7,
      sentiment: 'positive'
    },
    {
      code: 'LAX',
      name: 'Los Angeles International Airport',
      city: 'Los Angeles',
      complexityScore: 8.8,
      dailyFlights: 1400,
      terminals: 9,
      runways: 4,
      onTimeRate: 75.2,
      avgDelay: 16.7,
      cancellationRate: 2.8,
      delayProbability: 42,
      performanceCategory: 'Fair',
      complexityCategory: 'Very High',
      marketShare: 14.2,
      efficiencyScore: 62.8,
      riskFactors: ['Low on-time performance', 'High average delays', 'Very high complexity'],
      riskLevel: 'Medium',
      securityWaitTime: 22,
      connectionEfficiency: 70,
      weatherImpact: 'Medium',
      peakHours: ['7:00-10:00 AM', '5:00-8:00 PM'],
      constructionStatus: 'Major expansion project',
      dominantAirlines: ['American', 'United', 'Delta'],
      rating: 3.9,
      sentiment: 'positive'
    },
    {
      code: 'ORD',
      name: 'O\'Hare International Airport',
      city: 'Chicago',
      complexityScore: 9.5,
      dailyFlights: 2300,
      terminals: 4,
      runways: 8,
      onTimeRate: 68.9,
      avgDelay: 22.1,
      cancellationRate: 4.1,
      delayProbability: 52,
      performanceCategory: 'Poor',
      complexityCategory: 'Very High',
      marketShare: 23.1,
      efficiencyScore: 45.6,
      riskFactors: ['Low on-time performance', 'High average delays', 'High cancellation rate', 'Very high complexity'],
      riskLevel: 'High',
      securityWaitTime: 30,
      connectionEfficiency: 55,
      weatherImpact: 'Very High',
      peakHours: ['6:00-9:00 AM', '3:00-6:00 PM'],
      constructionStatus: 'Runway modernization',
      dominantAirlines: ['United', 'American', 'Southwest'],
      rating: 3.2,
      sentiment: 'neutral'
    },
    {
      code: 'ATL',
      name: 'Hartsfield-Jackson Atlanta International Airport',
      city: 'Atlanta',
      complexityScore: 7.8,
      dailyFlights: 2800,
      terminals: 2,
      runways: 5,
      onTimeRate: 82.3,
      avgDelay: 12.5,
      cancellationRate: 1.9,
      delayProbability: 28,
      performanceCategory: 'Excellent',
      complexityCategory: 'High',
      marketShare: 28.0,
      efficiencyScore: 82.7,
      riskFactors: [],
      riskLevel: 'Low',
      securityWaitTime: 18,
      connectionEfficiency: 85,
      weatherImpact: 'Medium',
      peakHours: ['6:00-9:00 AM', '4:00-7:00 PM'],
      constructionStatus: 'Terminal improvements',
      dominantAirlines: ['Delta', 'Southwest', 'American'],
      rating: 4.1,
      sentiment: 'positive'
    },
    {
      code: 'DFW',
      name: 'Dallas/Fort Worth International Airport',
      city: 'Dallas',
      complexityScore: 8.1,
      dailyFlights: 1800,
      terminals: 5,
      runways: 7,
      onTimeRate: 78.9,
      avgDelay: 14.2,
      cancellationRate: 2.3,
      delayProbability: 35,
      performanceCategory: 'Good',
      complexityCategory: 'High',
      marketShare: 18.1,
      efficiencyScore: 71.4,
      riskFactors: ['High average delays'],
      riskLevel: 'Low',
      securityWaitTime: 20,
      connectionEfficiency: 75,
      weatherImpact: 'High',
      peakHours: ['7:00-10:00 AM', '5:00-8:00 PM'],
      constructionStatus: 'Terminal D expansion',
      dominantAirlines: ['American', 'Southwest', 'Delta'],
      rating: 3.6,
      sentiment: 'positive'
    }
  ];

  // Sentiment analysis data for airport reviews
  const sentimentData = [
    { category: 'Terminal Experience', positive: 68, neutral: 22, negative: 10 },
    { category: 'Security Efficiency', positive: 72, neutral: 20, negative: 8 },
    { category: 'Dining & Shopping', positive: 65, neutral: 25, negative: 10 },
    { category: 'Cleanliness & Maintenance', positive: 75, neutral: 18, negative: 7 },
    { category: 'Staff Friendliness', positive: 70, neutral: 23, negative: 7 },
    { category: 'WiFi & Connectivity', positive: 58, neutral: 30, negative: 12 }
  ];

  const filteredAirports = airports.filter(airport =>
    airport.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate complexity score for sorting
  const getComplexityScore = (airport: Airport) => {
    const volumeScore = Math.min(airport.dailyFlights / 100, 10);
    const terminalScore = airport.terminals * 0.5;
    const runwayScore = airport.runways * 0.3;
    const weatherScore = airport.weatherImpact === 'Very High' ? 3 : airport.weatherImpact === 'High' ? 2 : 1;
    
    return (volumeScore * 0.4 + terminalScore * 0.2 + runwayScore * 0.2 + weatherScore * 0.2);
  };

  // Sort airports based on selected criteria
  const sortedAirports = [...filteredAirports].sort((a, b) => {
    switch (sortBy) {
      case 'complexity':
        return getComplexityScore(b) - getComplexityScore(a);
      case 'performance':
        return b.onTimeRate - a.onTimeRate;
      case 'delay':
        return a.avgDelay - b.avgDelay;
      case 'volume':
        return b.dailyFlights - a.dailyFlights;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return getComplexityScore(b) - getComplexityScore(a);
    }
  });

  const getPerformanceColor = (value: number, threshold: number, reverse = false) => {
    const isGood = reverse ? value <= threshold : value >= threshold;
    return isGood 
      ? isDarkMode ? 'text-green-400' : 'text-green-600'
      : isDarkMode ? 'text-red-400' : 'text-red-600';
  };

  const getComplexityColor = (score: number) => {
    if (score >= 8) return isDarkMode ? 'text-red-400' : 'text-red-600';
    if (score >= 6) return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
    return isDarkMode ? 'text-green-400' : 'text-green-600';
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            <TranslatedText text="Loading airport performance data..." targetLanguage={currentLanguage} />
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
                <Building className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              <TranslatedText text="Airport Analytics" targetLanguage={currentLanguage} />
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-4 max-w-3xl mx-auto">
              <TranslatedText 
                text="Analyze airport complexity and performance to make informed travel decisions" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`} />
              <input
                type="text"
                placeholder="Search airports by name, code, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
                    : 'border-slate-300 bg-white text-slate-900 placeholder-slate-500'
                }`}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={`px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDarkMode 
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'border-slate-300 bg-white text-slate-900'
                }`}
              >
                <option value="complexity">Highest Complexity</option>
                <option value="performance">Best Performance</option>
                <option value="delay">Lowest Delay</option>
                <option value="volume">Highest Volume</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Airport Performance Overview */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              <TranslatedText text="Airport Performance Overview" targetLanguage={currentLanguage} />
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <TranslatedText 
                text="Compare airports based on complexity and performance metrics" 
                targetLanguage={currentLanguage} 
              />
            </p>
            <p className={`text-sm mt-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              <TranslatedText 
                text="Complexity scores (1-10) indicate operational difficulty based on traffic volume, infrastructure, and weather sensitivity" 
                targetLanguage={currentLanguage} 
              />
            </p>
          </div>

          <div className="grid gap-6">
            {sortedAirports.map((airport) => (
              <div
                key={airport.code}
                className={`p-6 rounded-xl border shadow-md transition-all cursor-pointer relative ${
                  selectedAirport === airport.code
                    ? isDarkMode 
                      ? 'bg-blue-900/20 border-blue-600 shadow-lg shadow-blue-900/20' 
                      : 'bg-blue-50 border-blue-300 shadow-lg'
                    : isDarkMode 
                      ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' 
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => setSelectedAirport(selectedAirport === airport.code ? '' : airport.code)}
              >
                {/* Expand indicator arrow */}
                <div className={`absolute bottom-3 right-3 p-1 rounded-full transition-all ${
                  selectedAirport === airport.code
                    ? 'rotate-180 bg-blue-500 text-white'
                    : isDarkMode
                    ? 'bg-slate-600 text-slate-300'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  <ChevronDown className="w-4 h-4" />
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center ${isDarkMode ? 'bg-slate-700 border border-slate-600' : 'bg-slate-100 border border-slate-200'}`}>
                      <Plane className={`w-8 h-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        {airport.name}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {airport.city} • Code: {airport.code}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {/* Rating Display */}
                    <div className="text-right">
                      <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        User Rating
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                          {airport.rating || 3.8}/5
                        </span>
                        <Star className={`w-5 h-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                      </div>
                    </div>
                    
                    {/* Complexity Score */}
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Complexity Score
                        </div>
                        <div
                          title="Operational complexity based on traffic volume, infrastructure, and operational challenges. Higher scores indicate more complex operations and potential for delays."
                        >
                          <Info 
                            className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className={`font-semibold ${getComplexityColor(airport.complexityScore)}`}>
                          {airport.complexityScore}/10
                        </span>
                        <AlertTriangle className={`w-5 h-5 ${getComplexityColor(airport.complexityScore)}`} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(airport.onTimeRate, 75)}`}>
                      {airport.onTimeRate}%
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      On-Time Rate
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(airport.avgDelay, 15, true)}`}>
                      {airport.avgDelay}m
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Avg Delay
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getPerformanceColor(airport.cancellationRate, 2, true)}`}>
                      {airport.cancellationRate}%
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Cancellation Rate
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {airport.dailyFlights.toLocaleString()}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Daily Flights
                    </div>
                  </div>

                  <div className="text-center">
                    <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {airport.terminals}
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Terminals
                    </div>
                  </div>
                </div>

                {selectedAirport === airport.code && (
                  <div className="border-t pt-6 space-y-6">
                    {/* Complexity Analysis */}
                    <div>
                      <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Complexity Analysis" targetLanguage={currentLanguage} />
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Building className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Infrastructure
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Terminals:</span>
                              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{airport.terminals}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Runways:</span>
                              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{airport.runways}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Construction:</span>
                              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{airport.constructionStatus}</span>
                            </div>
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Wind className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Weather Impact
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Impact Level:</span>
                              <span className={getComplexityColor(airport.complexityScore)}>{airport.weatherImpact}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Security Wait:</span>
                              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{airport.securityWaitTime}m</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>Connections:</span>
                              <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>{airport.connectionEfficiency}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operational Insights */}
                    <div>
                      <h4 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        <TranslatedText text="Operational Insights" targetLanguage={currentLanguage} />
                      </h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Peak Hours
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            {airport.peakHours.map((hour, index) => (
                              <div key={index} className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                                • {hour}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              Dominant Airlines
                            </span>
                          </div>
                          <div className="space-y-1 text-sm">
                            {airport.dominantAirlines.map((airline, index) => (
                              <div key={index} className={isDarkMode ? 'text-slate-300' : 'text-slate-600'}>
                                • {airline}
                              </div>
                            ))}
                          </div>
                        </div>
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

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4 text-white">
            <TranslatedText text="Ready to Analyze Your Airport?" targetLanguage={currentLanguage} />
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            <TranslatedText
              text="Get detailed insights about airport complexity and performance to plan your travel better."
              targetLanguage={currentLanguage}
            />
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors">
              <TranslatedText text="Search Airports" targetLanguage={currentLanguage} />
            </button>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors">
              <TranslatedText text="Learn More" targetLanguage={currentLanguage} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}; 