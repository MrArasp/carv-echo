import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

interface PredictionButtonsProps {
  currentPrice: number;
  onPredict: (direction: "UP" | "DOWN", currentPrice: number) => void;
}

export const PredictionButtons = ({ currentPrice, onPredict }: PredictionButtonsProps) => {
  const handlePredict = (direction: "UP" | "DOWN") => {
    const targetPrice = direction === "UP" 
      ? (currentPrice * 1.05).toFixed(4)
      : (currentPrice * 0.95).toFixed(4);

    toast.info(`Predicting ${direction}`, {
      description: `Target: $${targetPrice}`,
    });

    onPredict(direction, currentPrice);
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <h3 className="text-xl font-bold mb-4 text-center">
        Make Your Prediction
      </h3>
      <p className="text-muted-foreground text-center mb-6">
        Will $CARV move 5% up or down by 00:00 UTC?
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={() => handlePredict("UP")}
          variant="prediction-up"
          size="xl"
          className="flex-col h-32"
        >
          <ArrowUp className="h-8 w-8 mb-2" />
          <span className="text-2xl font-bold">5% UP</span>
          <span className="text-sm opacity-80">
            Target: ${(currentPrice * 1.05).toFixed(4)}
          </span>
        </Button>
        <Button
          onClick={() => handlePredict("DOWN")}
          variant="prediction-down"
          size="xl"
          className="flex-col h-32"
        >
          <ArrowDown className="h-8 w-8 mb-2" />
          <span className="text-2xl font-bold">5% DOWN</span>
          <span className="text-sm opacity-80">
            Target: ${(currentPrice * 0.95).toFixed(4)}
          </span>
        </Button>
      </div>
    </Card>
  );
};
