import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";

export const PriceDisplay = () => {
  const [price, setPrice] = useState(1.23);
  const [timestamp, setTimestamp] = useState(new Date());

  useEffect(() => {
    // Mock price updates
    // In production, integrate with Jupiter Aggregator or real API
    const interval = setInterval(() => {
      setPrice((prev) => {
        const change = (Math.random() - 0.5) * 0.02;
        return Number((prev + change).toFixed(4));
      });
      setTimestamp(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-6 bg-gradient-to-br from-card/80 to-card/50 backdrop-blur-sm border-primary/20 glow-primary">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-primary animate-pulse-glow" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              Current $CARV Price
            </h3>
          </div>
          <p className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            ${price}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Last Updated</p>
          <p className="text-sm font-mono text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </p>
        </div>
      </div>
    </Card>
  );
};
