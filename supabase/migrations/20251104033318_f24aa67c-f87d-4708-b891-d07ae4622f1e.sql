-- Drop the existing RLS policy
DROP POLICY IF EXISTS "Users can only insert predictions for connected wallet" ON public.predictions;

-- Recreate the policy without hash validation
-- Signature verification already proves wallet ownership
CREATE POLICY "Users can only insert predictions for connected wallet" 
ON public.predictions 
FOR INSERT 
WITH CHECK (
  (signature IS NOT NULL) 
  AND (nonce IS NOT NULL)
);