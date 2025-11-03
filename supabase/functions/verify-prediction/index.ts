import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import bs58 from 'https://esm.sh/bs58@6.0.0';
import nacl from 'https://esm.sh/tweetnacl@1.0.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  walletAddress: string;
  prediction: string;
  currentPrice: number;
  targetPrice: string;
  signature: string;
  nonce: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress, prediction, currentPrice, targetPrice, signature, nonce, message }: VerifyRequest = await req.json();

    console.log('Verifying prediction signature...', { walletAddress, nonce });

    // Validate inputs
    if (!walletAddress || !prediction || !currentPrice || !targetPrice || !signature || !nonce || !message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if nonce has been used before (prevent replay attacks)
    const { data: existingNonce } = await supabase
      .from('prediction_nonces')
      .select('id')
      .eq('nonce', nonce)
      .single();

    if (existingNonce) {
      console.error('Nonce already used:', nonce);
      return new Response(
        JSON.stringify({ success: false, error: 'Nonce already used - replay attack detected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify message format
    const expectedMessage = `CARV Echo Prediction\nNonce: ${nonce}\nPrice: ${currentPrice}\nDirection: ${prediction}\nTarget: ${targetPrice}`;
    if (message !== expectedMessage) {
      console.error('Message mismatch:', { expected: expectedMessage, received: message });
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid message format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Verify signature using tweetnacl (Ed25519 for Solana)
    try {
      // Decode base58 signature and public key
      const signatureBytes = bs58.decode(signature);
      const publicKeyBytes = bs58.decode(walletAddress);
      const messageBytes = new TextEncoder().encode(message);

      // Verify the signature using nacl
      const isValid = nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);

      if (!isValid) {
        console.error('Invalid signature for wallet:', walletAddress);
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid signature' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        );
      }

      // Store nonce to prevent replay attacks
      const { error: nonceError } = await supabase
        .from('prediction_nonces')
        .insert({
          nonce,
          wallet_address: walletAddress,
        });

      if (nonceError) {
        console.error('Failed to store nonce:', nonceError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to store nonce' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      console.log('Signature verified successfully for wallet:', walletAddress);

      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: true,
          message: 'Signature verified successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Signature verification failed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

  } catch (error) {
    console.error('Verify prediction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
