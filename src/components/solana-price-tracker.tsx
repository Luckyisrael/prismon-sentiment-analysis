import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SolanaPriceTrackerProps {
  priceHistory: number[];
}

export function SolanaPriceTracker({ priceHistory }: SolanaPriceTrackerProps) {
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState(0);
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | 'neutral'>('neutral');
  
  useEffect(() => {
    if (priceHistory.length > 0) {
      const latestPrice = priceHistory[priceHistory.length - 1];
      setCurrentPrice(latestPrice);
      
      // Calculate price change from 24 hours ago
      if (priceHistory.length > 1) {
        const previousPrice = priceHistory[0];
        const change = ((latestPrice - previousPrice) / previousPrice) * 100;
        setPriceChange(change);
        
        if (change > 0.1) setPriceDirection('up');
        else if (change < -0.1) setPriceDirection('down');
        else setPriceDirection('neutral');
      }
    }
  }, [priceHistory]);
  
  // Convert price history to chart data
  const chartData = priceHistory.map((price, index) => ({
    time: index,
    price,
  }));

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          Solana (SOL/USD) Price
          <span className={cn(
            "ml-2 text-sm font-normal",
            priceDirection === 'up' ? 'text-green-500' : '',
            priceDirection === 'down' ? 'text-red-500' : ''
          )}>
            {priceDirection === 'up' && <ArrowUp className="inline h-4 w-4 mr-1" />}
            {priceDirection === 'down' && <ArrowDown className="inline h-4 w-4 mr-1" />}
            {priceDirection === 'neutral' && <ArrowRight className="inline h-4 w-4 mr-1" />}
            {priceChange.toFixed(2)}%
          </span>
        </CardTitle>
        <CardDescription>24-hour price movement</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => {
                  // Convert index to hour label (assuming 24 data points for 24 hours)
                  return `${24 - value}h`;
                }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                domain={['dataMin - 5', 'dataMax + 5']} 
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                labelFormatter={(value) => `${24 - value} hours ago`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke={priceDirection === 'up' ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))'}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Current Price</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-2xl font-bold">
                {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : 'Loading...'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">24h High</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-2xl font-bold">
                {priceHistory.length > 0 ? `$${Math.max(...priceHistory).toFixed(2)}` : 'Loading...'}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">24h Low</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <div className="text-2xl font-bold">
                {priceHistory.length > 0 ? `$${Math.min(...priceHistory).toFixed(2)}` : 'Loading...'}
              </div>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}