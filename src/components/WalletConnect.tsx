import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Wallet } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const WalletConnect = () => {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState("");

  const handleConnect = async () => {
    // Mock wallet connection for demo
    // In production, integrate with Backpack wallet SDK
    try {
      // Simulate wallet connection
      const mockAddress = "CARVxxx...abc123";
      setAddress(mockAddress);
      setConnected(true);
      toast.success("Wallet Connected!", {
        description: `Connected to ${mockAddress}`,
      });
    } catch (error) {
      toast.error("Connection Failed", {
        description: "Failed to connect Backpack wallet",
      });
    }
  };

  const handleDisconnect = () => {
    setAddress("");
    setConnected(false);
    toast.info("Wallet Disconnected");
  };

  return (
    <Card className="p-4 bg-card/50 backdrop-blur-sm border-primary/20">
      {!connected ? (
        <Button
          onClick={handleConnect}
          variant="glow"
          size="lg"
          className="w-full"
        >
          <Wallet className="mr-2 h-5 w-5" />
          Connect Backpack
        </Button>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <span className="text-sm font-mono text-muted-foreground">
              {address}
            </span>
          </div>
          <Button
            onClick={handleDisconnect}
            variant="ghost"
            size="sm"
          >
            Disconnect
          </Button>
        </div>
      )}
    </Card>
  );
};
