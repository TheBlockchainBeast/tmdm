/**
 * Generate sparkline data from price change percentage
 * Creates a realistic trend line based on the 24h price change
 */
export function generateSparkline(priceChange24h: number, dataPoints: number = 5): number[] {
  // Normalize price change to a 0-100 scale for sparkline height
  // Positive changes go up, negative changes go down
  const normalizedChange = Math.max(-50, Math.min(50, priceChange24h)); // Clamp between -50% and +50%
  
  // Generate data points that trend in the direction of price change
  const sparkline: number[] = [];
  const baseHeight = 50; // Middle point (50%)
  
  // Create a trend that reflects the price change
  // If price went up, trend upward; if down, trend downward
  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1); // 0 to 1
    const trend = normalizedChange * progress; // Linear trend
    const variation = (Math.sin(progress * Math.PI * 2) * 10); // Add some natural variation
    const height = baseHeight + trend + variation;
    
    // Clamp between 10% and 90% for visual consistency
    sparkline.push(Math.max(10, Math.min(90, height)));
  }
  
  return sparkline;
}

/**
 * Generate sparkline from multiple price change periods
 * Uses h1, h6, h24 if available for more accurate trend
 */
export function generateSparklineFromPriceChanges(
  priceChange?: {
    m5?: number;
    h1?: number;
    h6?: number;
    h24?: number;
  },
  dataPoints: number = 5
): number[] {
  if (!priceChange) {
    return [50, 50, 50, 50, 50]; // Flat line if no data
  }

  // Use available time periods to create a more accurate trend
  const periods = [
    priceChange.m5 || 0,
    priceChange.h1 || priceChange.m5 || 0,
    priceChange.h6 || priceChange.h1 || priceChange.m5 || 0,
    priceChange.h24 || priceChange.h6 || priceChange.h1 || 0,
    priceChange.h24 || 0, // Current (24h change)
  ].slice(0, dataPoints);

  // Normalize to 0-100 scale
  const baseHeight = 50;
  const sparkline = periods.map((change, index) => {
    const normalizedChange = Math.max(-40, Math.min(40, change));
    const progress = index / (periods.length - 1);
    const height = baseHeight + normalizedChange * (1 - progress * 0.5); // Trend toward current
    return Math.max(15, Math.min(85, height));
  });

  return sparkline;
}
