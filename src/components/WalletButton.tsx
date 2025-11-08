import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { CheckCircle2 } from "lucide-react";
export const WalletButton = () => {
  const {
    connected,
    publicKey
  } = useWallet();
  return <div className="relative">
      <WalletMultiButton className="!bg-gradient-to-r !from-accent !to-primary hover:!opacity-90 !h-9 !px-4 !transition-all !shadow-lg hover:!shadow-xl !border-0 !rounded-lg !text-sm !font-bold" />
      {connected && publicKey && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-success/20 border border-success/40 rounded px-1.5 py-0.5 pointer-events-none z-10">
          <CheckCircle2 className="h-2 w-2 text-success" />
          <span className="text-[7px] font-medium text-success">Connected</span>
        </div>}
    </div>;
};