import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { truncateAddress } from "@/lib/walletUtils";

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard')
        .select('hashed_wallet, total_points, correct_predictions, total_predictions')
        .order('total_points', { ascending: false })
        .limit(10);

      if (error) throw error;
      setLeaders(data || []);
    } catch (error) {
      console.error("Error loading leaderboard");
    } finally {
      setIsLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 2:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
        <h3 className="text-2xl font-bold mb-4">Leaderboard</h3>
        <div className="flex justify-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Trophy className="h-6 w-6 text-primary animate-pulse-glow" />
        Leaderboard
      </h3>
      
      {leaders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No predictions yet. Be the first!
        </div>
      ) : (
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <div
              key={leader.id}
              className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                index < 3
                  ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30'
                  : 'bg-muted/30 border-primary/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRankIcon(index)}
                  <div>
                    <p className="font-mono text-sm font-bold">
                      Trader #{leader.hashed_wallet}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {leader.correct_predictions}/{leader.total_predictions} correct
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {leader.total_points}
                  </p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
