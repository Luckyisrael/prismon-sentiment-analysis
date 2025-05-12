import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Wallet, ArrowUpRight, ArrowDownRight, ChevronDown } from 'lucide-react';

// Define the interface for price updates
interface PriceUpdate {
  id: string;
  price: {
    conf: string;
    expo: number;
    price: string;
    publish_time: number;
  };
  ema_price: {
    conf: string;
    expo: number;
    price: string;
    publish_time: number;
  };
  metadata: {
    prev_publish_time: number;
    proof_available_time: number;
    slot: number;
  };
  timestamp?: string;
}

// Known price feed IDs for the assets
const PRICE_FEED_MAP = {
  "c2289a6a43d2ce91c6f55caec370f4acc38a2ed477f58813334c6d03749ff2a4": "MSOL/USD",
  "ef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d": "SOL/USD",
  "55f8289be7450f1ae564dd9798e49e7d797d89adbc54fe4f8c906b1fcb94b0c3": "BNSOL/USD"
};

// Define the props for our component
interface PythPriceChartProps {
  priceUpdates: PriceUpdate[];
  timeWindow?: number; // Time window in minutes
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-3 rounded shadow-lg">
        <p className="text-gray-400">{`Time: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-semibold">
            {`${entry.name}: $${entry.value.toFixed(4)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Interpolate between two prices for smooth transitions
const interpolatePrice = (startPrice: number, endPrice: number, steps: number, currentStep: number) => {
  return startPrice + (endPrice - startPrice) * (currentStep / steps);
};

const PythCryptoChart = ({ priceUpdates, timeWindow = 5 }: PythPriceChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [candleData, setCandleData] = useState<any[]>([]);
  const [latestPrices, setLatestPrices] = useState<Record<string, { price: number, change: number }>>(
    Object.values(PRICE_FEED_MAP).reduce((acc, asset) => ({ ...acc, [asset]: { price: 0, change: 0 } }), {})
  );
  const [selectedAsset, setSelectedAsset] = useState<string>(Object.values(PRICE_FEED_MAP)[0] || "MSOL/USD");
  const [chartType, setChartType] = useState<'area' | 'candle'>('area');

  // Refs for managing data and animation
  const prevPricesRef = useRef<Record<string, number>>({});
  const lastProcessedTimeRef = useRef<number>(0);
  const chartDataRef = useRef<any[]>([]);
  const candleDataRef = useRef<any[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const animationStateRef = useRef<Record<string, { targetPrice: number, currentPrice: number, steps: number, currentStep: number }>>({});

  useEffect(() => {
    if (priceUpdates.length === 0) return;

    const processPriceUpdates = () => {
      const priceMap: Record<string, Record<number, { price: number, prevPrice: number }>> = {};
      const timePoints: Set<number> = new Set();
      const assetCandles: Record<string, Record<string, { open: number, high: number, low: number, close: number, volume: number }>> = {};

      // Process only new updates
      const newUpdates = priceUpdates.filter(
        update => update.price.publish_time > lastProcessedTimeRef.current
      );

      if (newUpdates.length === 0) return;

      newUpdates.forEach(update => {
        const assetName = PRICE_FEED_MAP[update.id] || update.id.substring(0, 8);
        const priceValue = parseFloat(update.price.price) * Math.pow(10, update.price.expo);
        const timePoint = update.price.publish_time;

        // Initialize animation state for smooth transitions
        if (!animationStateRef.current[assetName]) {
          animationStateRef.current[assetName] = {
            targetPrice: priceValue,
            currentPrice: priceValue,
            steps: 10, // Number of interpolation steps
            currentStep: 0
          };
        } else {
          animationStateRef.current[assetName].targetPrice = priceValue;
          animationStateRef.current[assetName].currentStep = 0;
        }

        // Update price map
        if (!priceMap[assetName]) priceMap[assetName] = {};
        const prevPrice = prevPricesRef.current[assetName] || priceValue;
        priceMap[assetName][timePoint] = { price: priceValue, prevPrice };
        prevPricesRef.current[assetName] = priceValue;
        timePoints.add(timePoint);

        // Update candlestick data
        const minuteKey = Math.floor(timePoint / 60) * 60;
        const minuteStr = String(minuteKey);
        if (!assetCandles[assetName]) assetCandles[assetName] = {};
        if (!assetCandles[assetName][minuteStr]) {
          assetCandles[assetName][minuteStr] = {
            open: priceValue,
            high: priceValue,
            low: priceValue,
            close: priceValue,
            volume: 1
          };
        } else {
          const candle = assetCandles[assetName][minuteStr];
          candle.high = Math.max(candle.high, priceValue);
          candle.low = Math.min(candle.low, priceValue);
          candle.close = priceValue;
          candle.volume += 1;
        }

        // Update latest prices
        const changePercent = prevPrice > 0 ? ((priceValue - prevPrice) / prevPrice) * 100 : 0;
        setLatestPrices(prev => ({
          ...prev,
          [assetName]: { price: priceValue, change: changePercent }
        }));
      });

      // Update last processed timestamp
      const maxTimePoint = Math.max(...Array.from(timePoints));
      lastProcessedTimeRef.current = maxTimePoint;

      // Generate new data points
      const newDataPoints = Array.from(timePoints)
        .sort()
        .map(timePoint => {
          const dataPoint: any = {
            time: timePoint,
            displayTime: new Date(timePoint * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          };
          Object.keys(priceMap).forEach(asset => {
            if (priceMap[asset][timePoint] !== undefined) {
              dataPoint[asset] = priceMap[asset][timePoint].price;
            }
          });
          return dataPoint;
        });

      // Update chartDataRef
      chartDataRef.current = [
        ...chartDataRef.current,
        ...newDataPoints
      ].slice(-100); // Keep last 100 points

      // Update candlestick data
      const candleTimePoints = Object.keys(assetCandles[selectedAsset] || {}).sort();
      const newCandleData = candleTimePoints.map(timeStr => {
        const timePoint = parseInt(timeStr);
        const candle = assetCandles[selectedAsset][timeStr];
        return {
          time: timePoint,
          displayTime: new Date(timePoint * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume
        };
      });

      candleDataRef.current = [
        ...candleDataRef.current.filter(candle => !candleTimePoints.includes(String(candle.time))),
        ...newCandleData
      ].slice(-30); // Keep last 30 candles

      // Start animation for smooth price updates
      const animate = () => {
        let needsUpdate = false;
        const updatedData = chartDataRef.current.map(dataPoint => {
          const newDataPoint = { ...dataPoint };
          Object.keys(animationStateRef.current).forEach(asset => {
            const animState = animationStateRef.current[asset];
            if (animState.currentStep < animState.steps) {
              animState.currentStep += 1;
              animState.currentPrice = interpolatePrice(
                animState.currentPrice,
                animState.targetPrice,
                animState.steps,
                animState.currentStep
              );
              newDataPoint[asset] = animState.currentPrice;
              needsUpdate = true;
            } else {
              newDataPoint[asset] = animState.targetPrice;
            }
          });
          return newDataPoint;
        });

        if (needsUpdate) {
          setChartData(updatedData);
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setChartData([...chartDataRef.current]);
          setCandleData([...candleDataRef.current]);
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Process updates with requestAnimationFrame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(processPriceUpdates);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [priceUpdates, selectedAsset]);

  // Generate unique colors for each asset
  const getAssetColor = (asset: string) => {
    switch (asset) {
      case 'MSOL/USD': return '#3B82F6';
      case 'SOL/USD': return '#10B981';
      case 'BNSOL/USD': return '#F59E0B';
      default: return '#8B5CF6';
    }
  };

  const getAssetGradient = (asset: string) => {
    switch (asset) {
      case 'MSOL/USD': return ['#3B82F6', 'rgba(59, 130, 246, 0.1)'];
      case 'SOL/USD': return ['#10B981', 'rgba(16, 185, 129, 0.1)'];
      case 'BNSOL/USD': return ['#F59E0B', 'rgba(245, 158, 11, 0.1)'];
      default: return ['#8B5CF6', 'rgba(139, 92, 246, 0.1)'];
    }
  };

  // Memoized chart component to prevent unnecessary re-renders
  const MemoizedChart = useMemo(() => {
    return chartData.length > 0 ? (
      <ResponsiveContainer width="100%" height="100%">
        {chartType === 'area' ? (
          <AreaChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
          >
            <defs>
              {Object.values(PRICE_FEED_MAP).map(asset => {
                const [color, fadeColor] = getAssetGradient(asset);
                return (
                  <linearGradient key={asset} id={`gradient-${asset}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={fadeColor} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis 
              dataKey="displayTime" 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#374151' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF' }} 
              axisLine={{ stroke: '#374151' }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ paddingBottom: '10px' }}
            />
            {Object.values(PRICE_FEED_MAP).map(asset => (
              selectedAsset === 'all' || selectedAsset === asset ? (
                <Area
                  key={asset}
                  type="monotone"
                  dataKey={asset}
                  name={asset}
                  stroke={getAssetColor(asset)}
                  fillOpacity={1}
                  fill={`url(#gradient-${asset})`}
                  dot={false}
                  animationDuration={0}
                  isAnimationActive={false}
                />
              ) : null
            ))}
          </AreaChart>
        ) : (
         <></>
        )}
      </ResponsiveContainer>
    ) : (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="animate-pulse mb-2">Loading price data...</div>
          <div className="text-sm">Waiting for Pyth oracle feed</div>
        </div>
      </div>
    );
  }, [chartData, candleData, chartType, selectedAsset]);

  return (
    <div className="flex flex-col w-full bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-800">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Wallet size={20} /> Pyth Oracle Price Feed
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded text-sm ${chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Area
          </button>
          <button 
            onClick={() => setChartType('candle')}
            className={`px-3 py-1 rounded text-sm ${chartType === 'candle' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            Candles
          </button>
        </div>
      </div>
      
      {/* Latest prices display */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {Object.entries(latestPrices).map(([asset, { price, change }]) => (
          <div 
            key={asset} 
            onClick={() => setSelectedAsset(asset)}
            className={`bg-gray-800 p-3 rounded shadow-sm border-l-4 cursor-pointer transition-all duration-200 hover:bg-gray-750 ${
              selectedAsset === asset ? 'ring-1 ring-blue-500' : ''
            }`} 
            style={{ borderColor: getAssetColor(asset) }}
          >
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-400 font-medium">{asset}</div>
              {change !== 0 && (
                <div className={`flex items-center text-xs ${change >= 0 ? 'text-green-400' : 'red-400'}`}>
                  {change >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(change).toFixed(2)}%
                </div>
              )}
            </div>
            <div className="text-lg font-bold text-white">${price.toFixed(4)}</div>
          </div>
        ))}
      </div>
      
      {/* Asset selector for mobile */}
      <div className="lg:hidden mb-4 relative">
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded cursor-pointer">
          <span className="text-white">{selectedAsset}</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
      
      {/* Chart */}
      <div className="w-full h-72">
        {MemoizedChart}
      </div>
      
      {/* Volume/stats bar */}
      <div className="mt-4 bg-gray-800 p-3 rounded flex justify-between text-xs text-gray-400">
        <div>
          24h Vol: <span className="text-white font-medium">$1.25M</span>
        </div>
        <div>
          Updated: <span className="text-white font-medium">
            {chartData.length > 0 ? new Date().toLocaleTimeString() : '--:--:--'}
          </span>
        </div>
        <div>
          Source: <span className="text-blue-400 font-medium">Pyth Network</span>
        </div>
      </div>
    </div>
  );
};

export default PythCryptoChart;