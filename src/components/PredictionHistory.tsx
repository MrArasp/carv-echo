import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const activePredictions = predictions.filter(p => p.status === 'locked');
  const historyPredictions = predictions.filter(p => p.status === 'correct' || p.status === 'wrong');

  const renderPredictionCard = (pred: any) => (
    <div
      key={pred.id}
      className="p-4 rounded-lg bg-muted/30 border border-primary/10 hover:border-primary/30 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <Badge variant={pred.prediction === "UP" ? "default" : "destructive"}>
          {pred.prediction} 5%
        </Badge>
        {pred.status === 'locked' && (
          <Lock className="h-4 w-4 text-muted-foreground" />
        )}
        {pred.status === 'correct' && (
          <Badge className="bg-success">+{pred.points} pts</Badge>
        )}
        {pred.status === 'wrong' && (
          <Badge variant="destructive">{pred.points} pts</Badge>
        )}
      </div>

      <div className="space-y-2 text-sm mb-3">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Start:</span>
          <span className="font-mono">${pred.current_price}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Target:</span>
          <span className="font-mono">${pred.target_price}</span>
        </div>
        {pred.final_price && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Final:</span>
            <span className="font-mono">${pred.final_price}</span>
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
            className="w-full mt-3"
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
          className="w-full mt-2"
          onClick={() => window.open(pred.ipfs_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          View on IPFS
        </Button>
      )}
    </div>
  );

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Your Predictions</h3>
        {onCheckPredictions && (
          <Button
            onClick={onCheckPredictions}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold glow-primary gap-2"
            size="default"
          >
            <RefreshCw className="h-4 w-4" />
            Check Predictions
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
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="active" className="relative">
              Active
              {activePredictions.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5">
                  {activePredictions.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activePredictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No active predictions. Make a new prediction to get started!
              </div>
            ) : (
              activePredictions.map(renderPredictionCard)
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {historyPredictions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No completed predictions yet.
              </div>
            ) : (
              historyPredictions.map(renderPredictionCard)
            )}
          </TabsContent>
        </Tabs>
      )}
    </Card>
  );
};
