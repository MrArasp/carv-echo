import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface RevealCardProps {
  prediction: any;
  onReveal: () => void;
}

export const RevealCard = ({ prediction, onReveal }: RevealCardProps) => {
  const [finalPrice, setFinalPrice] = useState("");
  const [isRevealing, setIsRevealing] = useState(false);

  const handleReveal = async () => {
    if (!finalPrice || isNaN(Number(finalPrice))) {
      toast.error("Please enter a valid price");
      return;
    }

    setIsRevealing(true);
    const finalPriceNum = Number(finalPrice);
    const currentPrice = Number(prediction.current_price);
    const targetPrice = Number(prediction.target_price);

    // Determine if prediction was correct
    let isCorrect = false;
    if (prediction.prediction === "UP") {
      isCorrect = finalPriceNum >= targetPrice;
    } else {
      isCorrect = finalPriceNum <= targetPrice;
    }

    const points = isCorrect ? 10 : 0;
    const status = isCorrect ? "correct" : "wrong";

    try {
      // Update prediction
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          final_price: finalPriceNum,
          status,
          points,
        })
        .eq('id', prediction.id);

      if (updateError) throw updateError;

      // Update or create leaderboard entry
      const { data: existingEntry } = await supabase
        .from('leaderboard')
        .select('*')
        .eq('wallet_address', prediction.wallet_address)
        .maybeSingle();

      if (existingEntry) {
        const { error: leaderboardError } = await supabase
          .from('leaderboard')
          .update({
            total_predictions: existingEntry.total_predictions + 1,
            correct_predictions: existingEntry.correct_predictions + (isCorrect ? 1 : 0),
            total_points: existingEntry.total_points + points,
          })
          .eq('wallet_address', prediction.wallet_address);

        if (leaderboardError) throw leaderboardError;
      } else {
        const { error: insertError } = await supabase
          .from('leaderboard')
          .insert({
            wallet_address: prediction.wallet_address,
            total_predictions: 1,
            correct_predictions: isCorrect ? 1 : 0,
            total_points: points,
          });

        if (insertError) throw insertError;
      }

      toast.success(
        isCorrect ? "Correct Prediction! 🎉" : "Wrong Prediction",
        { description: isCorrect ? `+${points} points!` : "Better luck next time!" }
      );

      onReveal();
    } catch (error) {
      console.error("Error revealing:", error);
      toast.error("Failed to reveal prediction");
    } finally {
      setIsRevealing(false);
    }
  };

  const canReveal = new Date(prediction.unlock_at) <= new Date();

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <h3 className="text-xl font-bold mb-4">Reveal Prediction</h3>
      
      <div className="space-y-4">
        <div className="p-4 rounded-lg bg-muted/30 border border-primary/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Your Prediction:</span>
            <Badge variant={prediction.prediction === "UP" ? "default" : "destructive"}>
              {prediction.prediction} 5%
            </Badge>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Start:</span>
            <span className="font-mono">${prediction.current_price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Target:</span>
            <span className="font-mono">${prediction.target_price}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="finalPrice">Final Price at 00:00 UTC</Label>
          <Input
            id="finalPrice"
            type="number"
            step="0.0001"
            placeholder="Enter final price"
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value)}
            disabled={!canReveal || isRevealing}
          />
        </div>

        <Button
          onClick={handleReveal}
          disabled={!canReveal || !finalPrice || isRevealing}
          variant="glow"
          size="lg"
          className="w-full"
        >
          {isRevealing ? "Revealing..." : canReveal ? "Reveal Result" : "Locked"}
        </Button>
      </div>
    </Card>
  );
};
