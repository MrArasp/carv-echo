import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

interface PricePoint {
  timestamp: number;
  price: number;
  open: number;
  high: number;
  low: number;
  volume: number;
}

export const PriceChart = () => {
  const [historyData, setHistoryData] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchHistory, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchHistory = async () => {
    try {
      console.log('Fetching price history...');
      const { data, error } = await supabase.functions.invoke('get-carv-history');
      
      if (error) {
        console.error("Error fetching history:", error);
        setIsLoading(false);
        return;
      }

      console.log('History data received:', data);

      if (data?.history && data.history.length > 0) {
        setHistoryData(data.history);
      } else {
        console.warn('No history data available');
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatTooltip = (value: any, name: string) => {
    if (name === 'price') {
      return [`$${Number(value).toFixed(4)}`, 'Price'];
    }
    return [value, name];
  };

  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-md border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            CARV/USDT 24H Chart
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-md border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary animate-pulse-glow" />
          CARV/USDT 24H Chart
        </CardTitle>
        <p className="text-xs text-muted-foreground">Last 24 hours • 1H intervals</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={historyData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={formatXAxis}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toFixed(4)}`}
            />
            <Tooltip 
              formatter={formatTooltip}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--primary) / 0.3)',
                borderRadius: '8px',
                color: 'hsl(var(--foreground))',
              }}
              labelFormatter={(timestamp) => new Date(timestamp).toLocaleString()}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
