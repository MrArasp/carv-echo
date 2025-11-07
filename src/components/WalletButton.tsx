import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Shield } from "lucide-react";
import { truncateAddress } from "@/lib/walletUtils";

export const WalletButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <Card className="p-2 bg-card/50 backdrop-blur-sm border-primary/20">
      <WalletMultiButton 
        className="!bg-primary !text-primary-foreground hover:!bg-primary/90 !rounded-lg !h-8 !px-3 !font-bold glow-primary !transition-all !text-xs" 
      />
      {connected && publicKey && (
        <div className="flex items-center justify-between mt-1 px-1">
          <Badge variant="outline" className="text-[10px] font-mono py-0 px-1 h-4">
            {truncateAddress(publicKey.toString())}
          </Badge>
          <div className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-2.5 w-2.5" />
            <span className="text-[8px]">CARV SVM</span>
          </div>
        </div>
      )}
    </Card>
  );
};
