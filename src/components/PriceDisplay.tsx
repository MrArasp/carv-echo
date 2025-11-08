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
    <Card className="p-6 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm border-primary/20 glow-primary">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse-glow" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Current $CARV Price
            </h3>
          </div>
          <p className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ${price.toFixed(4)}
          </p>
        </div>
        <div className="text-right space-y-2">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="text-sm font-mono text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </p>
          <Button
            onClick={fetchPrice}
            disabled={isRefreshing}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-primary/10">
        <p className="text-xs text-muted-foreground text-center">
          Live data from Bybit • CARV/USDT • Updates every 10s
        </p>
      </div>
    </Card>
  );
};
