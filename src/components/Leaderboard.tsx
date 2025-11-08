import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import { truncateAddress } from "@/lib/walletUtils";
import { cn } from "@/lib/utils";

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userTruncatedAddress, setUserTruncatedAddress] = useState<string | null>(null);
  const { publicKey } = useWallet();

  useEffect(() => {
    if (publicKey) {
      const truncated = truncateAddress(publicKey.toString());
      setUserTruncatedAddress(truncated);
    } else {
      setUserTruncatedAddress(null);
    }
  }, [publicKey]);

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
      const { data, error } = await supabase.functions.invoke('get-leaderboard');

      if (error) throw error;
      setLeaders(data?.leaderboard || []);
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

  return (
    <Card className="p-6 bg-card border-accent/40 glow-purple">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold">Leaderboard</h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {leaders.map((leader, index) => {
            const isCurrentUser = userTruncatedAddress && leader.wallet_address === userTruncatedAddress;
            return (
              <div
                key={leader.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg transition-all",
                  isCurrentUser
                    ? "bg-primary/20 border border-primary/40"
                    : "bg-card/50 hover:bg-card/80"
                )}
              >
                <div className="flex-shrink-0 w-8 text-center">
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-foreground truncate">
                      {leader.wallet_address}
                    </p>
                    {isCurrentUser && (
                      <Badge variant="default" className="text-xs bg-primary">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                    <span>{leader.correct_predictions}/{leader.total_predictions} wins</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-primary">{leader.total_points}</p>
                  <p className="text-xs text-muted-foreground">pts</p>
                </div>
              </div>
            );
          })}
          {leaders.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No leaderboard data yet
            </p>
          )}
        </div>
      )}
    </Card>
  );
};
