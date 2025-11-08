import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Lock, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CountdownTimer } from "./CountdownTimer";
import { RevealCard } from "./RevealCard";

interface PredictionHistoryProps {
  walletAddress: string | null;
  refreshTrigger: number;
  onCheckPredictions?: () => void;
}

export const PredictionHistory = ({ walletAddress, refreshTrigger, onCheckPredictions }: PredictionHistoryProps) => {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [selectedPrediction, setSelectedPrediction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (walletAddress) {
      loadPredictions();
    }
  }, [walletAddress, refreshTrigger]);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-predictions', {
        body: { walletAddress }
      });

      if (error) throw error;
      setPredictions(data?.predictions || []);
    } catch (error) {
      console.error("Error loading predictions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!walletAddress) {
    return null;
  }

  if (selectedPrediction && selectedPrediction.status === 'locked') {
    return (
      <div className="space-y-4">
        <Button
          onClick={() => setSelectedPrediction(null)}
          variant="ghost"
          size="sm"
        >
          ← Back to History
        </Button>
        <RevealCard 
          prediction={selectedPrediction} 
          onReveal={() => {
            setSelectedPrediction(null);
            loadPredictions();
          }}
        />
      </div>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Your Predictions</h3>
        {onCheckPredictions && (
          <Button
            onClick={onCheckPredictions}
            variant="outline"
            className="border-primary/40 hover:border-primary hover:bg-primary/10 gap-2"
            size="sm"
          >
            <RefreshCw className="h-4 w-4" />
            Check
          </Button>
        )}
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No predictions yet. Make your first prediction!
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => (
            <div
              key={pred.id}
              className="p-3 rounded-lg bg-card/40 border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <Badge 
                  variant={pred.prediction === "UP" ? "default" : "destructive"}
                  className={pred.prediction === "UP" ? "bg-primary/20 text-primary border-primary/40" : "bg-pink-500/20 text-pink-500 border-pink-500/40"}
                >
                  {pred.prediction} 5%
                </Badge>
                {pred.status === 'locked' && (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                {pred.status === 'correct' && (
                  <Badge className="bg-primary/20 text-primary border-primary/40">+{pred.points} pts</Badge>
                )}
                {pred.status === 'wrong' && (
                  <Badge className="bg-pink-500/20 text-pink-500 border-pink-500/40">{pred.points} pts</Badge>
                )}
              </div>

              <div className="space-y-1 text-xs mb-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-mono text-foreground">${pred.current_price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-mono text-foreground">${pred.target_price}</span>
                </div>
                {pred.final_price && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Final:</span>
                    <span className="font-mono text-foreground">${pred.final_price}</span>
                  </div>
                )}
              </div>

              {pred.status === 'locked' && (
                <>
                  <CountdownTimer unlockAt={pred.unlock_at} />
                  <Button
                    onClick={() => setSelectedPrediction(pred)}
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 border-primary/40 hover:border-primary hover:bg-primary/10"
                    disabled={new Date(pred.unlock_at) > new Date()}
                  >
                    {new Date(pred.unlock_at) > new Date() ? "Locked" : "Reveal"}
                  </Button>
                </>
              )}

              {pred.ipfs_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 text-xs"
                  onClick={() => window.open(pred.ipfs_url, '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  IPFS
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
