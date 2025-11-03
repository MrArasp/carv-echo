-- Step 1: Drop the dependent RLS policy
DROP POLICY IF EXISTS "Users can only insert predictions for connected wallet" ON public.predictions;

-- Step 2: Drop and recreate the hash function with proper type casting
DROP FUNCTION IF EXISTS public.hash_wallet_address(text);

CREATE OR REPLACE FUNCTION public.hash_wallet_address(wallet_addr text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Return first 8 characters of SHA256 hash for privacy
  RETURN substring(encode(digest(wallet_addr::bytea, 'sha256'::text), 'hex'), 1, 8);
END;
$function$;

-- Step 3: Recreate the RLS policy
CREATE POLICY "Users can only insert predictions for connected wallet" 
ON public.predictions 
FOR INSERT 
WITH CHECK (
  (signature IS NOT NULL) 
  AND (nonce IS NOT NULL) 
  AND (hashed_wallet = hash_wallet_address(wallet_address))
);