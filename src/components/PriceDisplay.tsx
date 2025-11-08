import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PriceDisplayProps {
  onPriceUpdate?: (price: number) => void;
}

export const PriceDisplay = ({ onPriceUpdate }: PriceDisplayProps) => {
  const [price, setPrice] = useState(1.23);
  const [timestamp, setTimestamp] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchPrice = async () => {
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-carv-price');
      
      if (error) {
        console.error("Error fetching price:", error);
        toast.error("Failed to fetch price", {
          description: "Using fallback price",
        });
        return;
      }

      setPrice(data.price);
      setTimestamp(new Date(data.timestamp));
      onPriceUpdate?.(data.price);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Fetch price on mount
    fetchPrice();

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchPrice, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-8 bg-card border-accent/40 glow-purple">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-muted-foreground">
            Current $CARV Price
          </h3>
        </div>
        <p className="text-7xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          ${price.toFixed(4)}
        </p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Last Updated: {timestamp.toLocaleTimeString()}
          </p>
          <p className="text-xs text-muted-foreground">
            Live data from Bybit • CARV/USDT • Updates every 10s
          </p>
        </div>
      </div>
    </Card>
  );
};
