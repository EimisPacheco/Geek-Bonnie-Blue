import { Flight } from '../context/FlightContext';

/**
 * Convert minutes to hours and minutes format
 * @param minutes - Number of minutes or string containing minutes
 * @returns Formatted string like "2h 30m" or "45m"
 */
export function convertMinutesToHours(minutes: number | string): string {
  const totalMinutes = typeof minutes === 'string' ? parseInt(minutes) : minutes;
  
  if (isNaN(totalMinutes) || totalMinutes <= 0) {
    return '0m';
  }
  
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  if (hours > 0 && mins > 0) {
    return `${hours}h ${mins}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${mins}m`;
  }
}

/**
 * Extract minutes from duration string like "2h 30m" or "45m"
 * @param duration - Duration string
 * @returns Total minutes as number
 */
export function extractMinutesFromDuration(duration: string): number {
  if (!duration) return 0;
  
  // Handle cases like "1h 15m", "2h", "45m", "1h15m"
  const hoursMatch = duration.match(/(\d+)h/);
  const minutesMatch = duration.match(/(\d+)m/);
  
  const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
  const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

/**
 * Calculate total layover time from connections
 * @param connections - Array of flight connections
 * @returns Total layover time in minutes
 */
export function calculateTotalLayoverTime(connections: Flight[]): number {
  console.log(`🔍 calculateTotalLayoverTime called with ${connections?.length || 0} connections`);
  
  if (!connections || connections.length === 0) {
    console.log(`🔍 No connections found, returning 0`);
    return 0;
  }
  
  const total = connections.reduce((total, connection, index) => {
    console.log(`🔍 Processing connection ${index + 1}:`, {
      layoverInfo: connection.layoverInfo,
      layoverDuration: connection.layoverInfo?.duration,
      connectionDuration: connection.duration
    });
    
    // ONLY count layover durations, NOT flight segment durations
    if (connection.layoverInfo?.duration) {
      const minutes = parseDurationToMinutes(connection.layoverInfo.duration);
      console.log(`🔍 Connection ${index + 1} layover duration: "${connection.layoverInfo.duration}" -> ${minutes} minutes`);
      return total + minutes;
    }
    
    // Do NOT add connection.duration as it's the flight segment duration, not layover
    console.log(`🔍 Connection ${index + 1} no layover duration found, skipping`);
    return total;
  }, 0);
  
  console.log(`🔍 Total layover time calculated: ${total} minutes`);
  return total;
} 

/**
 * Formats layover duration by converting minutes to hours when appropriate
 * @param duration - Duration string or number (e.g., "300m", "45m", "2h 30m", 300, 45)
 * @returns Formatted duration string (e.g., "5h 0m", "45m", "2h 30m")
 */
export const formatLayoverDuration = (duration: string | number): string => {
  console.log(`🔍 formatLayoverDuration input: "${duration}" (type: ${typeof duration})`);
  
  if (!duration) return '0m';
  
  // Convert to string if it's a number
  const durationStr = typeof duration === 'number' ? `${duration}m` : String(duration);
  console.log(`🔍 Normalized duration string: "${durationStr}"`);
  
  // If it already has hours, return as is
  if (durationStr.includes('h')) {
    console.log(`🔍 Already has hours, returning: "${durationStr}"`);
    return durationStr;
  }
  
  // Extract minutes from the duration string
  const minutesMatch = durationStr.match(/(\d+)m/);
  if (minutesMatch) {
    const minutes = parseInt(minutesMatch[1]);
    console.log(`🔍 Extracted minutes: ${minutes}`);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      const result = remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
      console.log(`🔍 Converting to hours: "${durationStr}" -> "${result}"`);
      return result;
    }
  }
  
  // If no minutes found or less than 60, return as is
  console.log(`🔍 No conversion needed, returning: "${durationStr}"`);
  return durationStr;
};

/**
 * Parses duration string to minutes
 * @param duration - Duration string (e.g., "300m", "2h 30m", "5h")
 * @returns Number of minutes
 */
export const parseDurationToMinutes = (duration: string | number): number => {
  if (typeof duration === 'number') return duration;
  if (!duration) return 0;
  
  const durationStr = String(duration).toLowerCase();
  
  // Handle "Xh Ym" format
  const hourMinMatch = durationStr.match(/(\d+)h\s*(\d+)m/);
  if (hourMinMatch) {
    const hours = parseInt(hourMinMatch[1]);
    const minutes = parseInt(hourMinMatch[2]);
    return hours * 60 + minutes;
  }
  
  // Handle "Xh" format
  const hourMatch = durationStr.match(/(\d+)h/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    return hours * 60;
  }
  
  // Handle "Xm" format
  const minuteMatch = durationStr.match(/(\d+)m/);
  if (minuteMatch) {
    return parseInt(minuteMatch[1]);
  }
  
  // Handle plain number (assume minutes)
  const numberMatch = durationStr.match(/^(\d+)$/);
  if (numberMatch) {
    return parseInt(numberMatch[1]);
  }
  
  return 0;
};

/**
 * Calculate total travel time for a flight including layovers
 * @param flight - Flight object
 * @returns Formatted total travel time string
 */
export const calculateTotalTravelTime = (flight: Flight): string => {
  try {
    let totalMinutes = 0;
    
    // Add main flight duration
    if (flight.duration) {
      totalMinutes += extractMinutesFromDuration(flight.duration);
    }
    
    // Add layover durations
    if (flight.connections && flight.connections.length > 0) {
      flight.connections.forEach(connection => {
        if (connection.layoverInfo?.duration) {
          totalMinutes += extractMinutesFromDuration(connection.layoverInfo.duration);
        }
      });
    }
    
    // Add final segment travel time if available
    if (flight.finalSegmentTravelTime) {
      totalMinutes += extractMinutesFromDuration(flight.finalSegmentTravelTime);
    }
    
    // Convert to hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  } catch (error) {
    console.error('Error calculating total travel time:', error);
    return 'Unknown';
  }
}; 