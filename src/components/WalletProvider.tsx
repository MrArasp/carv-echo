import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// CARV SVM Testnet RPC
const CARV_RPC = 'https://rpc.testnet.carv.io/rpc';

export const WalletProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Configure for CARV SVM Testnet
  const endpoint = useMemo(() => CARV_RPC, []);

  // Empty wallets array allows any wallet to connect (including Backpack)
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};
