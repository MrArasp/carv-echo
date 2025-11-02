-- Fix search_path security issue for hash_wallet_address function
CREATE OR REPLACE FUNCTION public.hash_wallet_address(wallet_addr TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Return first 8 characters of SHA256 hash for privacy
  RETURN substring(encode(digest(wallet_addr, 'sha256'), 'hex'), 1, 8);
END;
$$;