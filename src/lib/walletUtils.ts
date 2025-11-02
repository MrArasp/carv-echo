/**
 * Wallet utility functions for privacy and security
 */

/**
 * Truncates a wallet address for display (shows first 4 and last 4 characters)
 * Example: "abc123...xyz789"
 */
export const truncateAddress = (address: string | null | undefined): string => {
  if (!address) return '';
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

/**
 * Hashes a wallet address for anonymous storage (SHA-256, first 8 chars)
 * This matches the backend hash_wallet_address function
 */
export const hashWalletAddress = async (address: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(address);
  // Type assertion needed due to TypeScript lib strictness with SharedArrayBuffer
  const hashBuffer = await crypto.subtle.digest('SHA-256', data as unknown as BufferSource);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.substring(0, 8);
};

/**
 * Sanitizes wallet address for logging (never log full address)
 */
export const sanitizeAddressForLog = (address: string | null | undefined): string => {
  if (!address) return 'no-wallet';
  return `wallet-${address.slice(0, 4)}`;
};
