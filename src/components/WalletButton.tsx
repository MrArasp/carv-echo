import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CheckCircle2 } from "lucide-react";

export const WalletButton = () => {
  const { connected, publicKey } = useWallet();

  return (
    <div className="relative">
      <WalletMultiButton 
        className="!bg-gradient-to-r !from-primary !to-secondary hover:!opacity-90 !rounded-lg !h-7 !px-3 !font-bold !transition-all !text-[10px] !shadow-lg hover:!shadow-xl !border-0" 
      />
      {connected && publicKey && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-success/20 border border-success/40 rounded px-1.5 py-0.5">
          <CheckCircle2 className="h-2 w-2 text-success" />
          <span className="text-[7px] font-medium text-success">Connected</span>
        </div>
      )}
    </div>
  );
};
