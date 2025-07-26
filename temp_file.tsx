import React from 'react';
import { TrendingUp, CloudRain, Clock, AlertCircle, Building2, Calendar } from 'lucide-react';
import { Flight } from '../../context/FlightContext';
import { InsuranceRecommendations } from './InsuranceRecommendations';
import { ConnectionAnalysis } from './ConnectionAnalysis';
import TranslatedText from '../TranslatedText';
import { useTranslation } from '../../context/TranslationContext';
import { convertMinutesToHours, calculateTotalLayoverTime } from '../../utils/timeUtils';
import { capitalizeFirstLetter, getRiskColor, formatRiskLevel } from '../../utils/textUtils';

interface RiskInsightsProps {
  flight: Flight | null;
}

export const RiskInsights: React.FC<RiskInsightsProps> = ({ flight }) => {
  const { currentLanguage } = useTranslation();
  
  const getAirportImage = (airportCode: string): string => {
    // Use a consistent airport terminal image for all airports to avoid random images
    // This ensures all airport images are actually airport-related
    return '/white_circle_360x360.svg';
  };

  if (!flight) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8">
        <p className="text-slate-500 text-center">
          <TranslatedText text="No flight data available for risk analysis." targetLanguage={currentLanguage} />
        </p>
      </div>
    );
  }

  const insights = [
    {
      icon: TrendingUp,
      label: 'Overall Risk',
      value: formatRiskLevel(flight.riskFactors.overallRisk),
      color: getRiskColor(flight.riskFactors.overallRisk),
      description: flight.riskFactors.overallRisk === 'low' 
        ? 'Low probability of significant disruptions'
        : flight.riskFactors.overallRisk === 'medium'
        ? 'Moderate chance of delays or minor issues'
        : 'Higher likelihood of delays or complications'
    },
    {
      icon: CloudRain,
      label: 'Weather Risk',
      value: formatRiskLevel(flight.riskFactors.weatherRisk),
      color: getRiskColor(flight.riskFactors.weatherRisk),
      description: flight.riskFactors.weatherRisk === 'low'
        ? 'Clear conditions expected'
        : flight.riskFactors.weatherRisk === 'medium'
        ? 'Some weather concerns possible'
        : 'Significant weather risks present'
    },
    {
      icon: Clock,
      label: 'Historical Delays',
      value: convertMinutesToHours(flight.riskFactors.historicalDelays),
      color: flight.riskFactors.historicalDelays <= 30 ? 'text-green-600' : 
             flight.riskFactors.historicalDelays <= 60 ? 'text-amber-600' : 'text-red-600',
      description: `Average delay time for this route`
    },
    {
      icon: AlertCircle,
      label: 'Cancellation Rate',
      value: `${flight.riskFactors.cancellationRate}%`,
      color: flight.riskFactors.cancellationRate <= 3 ? 'text-green-600' : 
             flight.riskFactors.cancellationRate <= 8 ? 'text-amber-600' : 'text-red-600',
      description: 'Historical cancellation percentage'
    },
    {
      icon: Building2,
      label: 'Airport Complexity',
      value: formatRiskLevel(flight.riskFactors.airportComplexity),
      color: getRiskColor(flight.riskFactors.airportComplexity),
      description: flight.riskFactors.airportComplexity === 'low'
        ? 'Simple airport operations'
        : flight.riskFactors.airportComplexity === 'medium'
        ? 'Moderately complex operations'
        : 'High complexity operations'
    }
  ];

  // Add connection risk for flights with layovers
  if (flight.connections && flight.connections.length > 0) {
    const totalLayoverMinutes = calculateTotalLayoverTime(flight.connections);
    const layoverRisk = totalLayoverMinutes < 60 ? 'high' : 
                       totalLayoverMinutes < 120 ? 'medium' : 'low';
    
    insights.splice(2, 0, {
      icon: Clock,
      label: 'Connection Risk',
      value: formatRiskLevel(layoverRisk),
      color: getRiskColor(layoverRisk),
      description: `${convertMinutesToHours(totalLayoverMinutes)} total layover time`
    });
  }

  // Determine if insurance should be shown
  const shouldShowInsurance = 
    flight.riskFactors.overallRisk !== 'low' ||
    flight.riskFactors.weatherRisk !== 'low' ||
    flight.riskFactors.cancellationRate > 5 ||
    flight.riskFactors.historicalDelays > 45;

  // Weather truncation helper
  const truncateWeatherRisk = (description: string, reasoning?: string) => {
    if (description.length <= 150) {
      return <TranslatedText text={description} targetLanguage={currentLanguage} />;
    }
    
    const truncated = description.substring(0, 150);
    const lastSpace = truncated.lastIndexOf(' ');
    const finalText = lastSpace > 100 ? truncated.substring(0, lastSpace) : truncated;
    
    return (
      <span>
        <TranslatedText text={finalText + '...'} targetLanguage={currentLanguage} />
        {reasoning && (
          <span className="text-blue-600 text-sm ml-1">
            (Analysis: <TranslatedText text={reasoning.substring(0, 50) + '...'} targetLanguage={currentLanguage} />)
          </span>
        )}
      </span>
    );
  };

  // Function to parse seasonal factors and make labels bold
  const parseSeasonalFactor = (factor: string) => {
    const colonIndex = factor.indexOf(':');
    if (colonIndex === -1) {
      // No colon found, return as is with translation
      return (
        <span className="text-slate-700">
          <TranslatedText text={factor} targetLanguage={currentLanguage} />
        </span>
      );
    }
    
    const label = factor.substring(0, colonIndex + 1); // Include the colon
    const description = factor.substring(colonIndex + 1).trim();
    
    return (
      <span className="text-slate-700">
        <span className="font-bold">
          <TranslatedText text={label} targetLanguage={currentLanguage} />
        </span>
        {description && (
          <span>
            {' '}
            <TranslatedText text={description} targetLanguage={currentLanguage} />
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Risk Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-6">
          <TranslatedText text="Risk Analysis" targetLanguage={currentLanguage} />
        </h3>
        
        <div className="space-y-4 mb-6">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg bg-white ${insight.color.replace('text-', 'text-')} bg-opacity-10`}>
                  <insight.icon className={`w-5 h-5 ${insight.color}`} />
                </div>
                <div>
                  <div className="font-medium text-slate-900">
                    <TranslatedText text={insight.label} targetLanguage={currentLanguage} />
                  </div>
                  <div className="text-sm text-slate-600">
                    <TranslatedText text={insight.description} targetLanguage={currentLanguage} />
                  </div>
                </div>
              </div>
              <div className={`text-lg font-semibold ${insight.color}`}>
                {insight.value}
              </div>
            </div>
          ))}
        </div>

        {/* Key Risk Factors */}
        {flight.riskFactors.keyRiskFactors && flight.riskFactors.keyRiskFactors.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-slate-900">
              <TranslatedText text="Key Risk Factors" targetLanguage={currentLanguage} />
            </h4>
            <div className="space-y-2">
              {flight.riskFactors.keyRiskFactors.map((factor, index) => (
                <div key={index} className="flex items-start space-x-2 text-sm">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-slate-700">
                    <TranslatedText text={factor} targetLanguage={currentLanguage} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Connection Analysis and Airport Analysis - Side by side for flights with connections */}
      {flight.connections && flight.connections.length > 0 ? (
