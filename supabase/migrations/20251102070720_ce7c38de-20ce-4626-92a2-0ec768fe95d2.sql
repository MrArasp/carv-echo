-- Create prediction_nonces table to prevent replay attacks
CREATE TABLE IF NOT EXISTS public.prediction_nonces (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nonce TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for fast nonce lookup
CREATE INDEX IF NOT EXISTS idx_prediction_nonces_nonce ON public.prediction_nonces(nonce);

-- Enable RLS
ALTER TABLE public.prediction_nonces ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read nonces (for verification)
CREATE POLICY "Anyone can view nonces"
ON public.prediction_nonces
FOR SELECT
USING (true);

-- Only authenticated users can insert nonces (via edge function)
CREATE POLICY "Service role can insert nonces"
ON public.prediction_nonces
FOR INSERT
WITH CHECK (true);

-- Add signature and nonce columns to predictions table
ALTER TABLE public.predictions
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS nonce TEXT UNIQUE;

-- Add index for nonce lookup
CREATE INDEX IF NOT EXISTS idx_predictions_nonce ON public.predictions(nonce);