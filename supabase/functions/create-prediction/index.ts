import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreatePredictionRequest {
  walletAddress: string;
  hashedWallet: string;
  currentPrice: number;
  prediction: string;
  targetPrice: number;
  unlockAt: string;
  ipfsUrl: string | null;
  signature: string;
  nonce: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      walletAddress,
      hashedWallet,
      currentPrice,
      prediction,
      targetPrice,
      unlockAt,
      ipfsUrl,
      signature,
      nonce,
    }: CreatePredictionRequest = await req.json();

    // Validate inputs
    if (!walletAddress || !prediction || !currentPrice || !targetPrice || !signature || !nonce) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify nonce exists (should have been created by verify-prediction)
    const { data: nonceData } = await supabase
      .from('prediction_nonces')
      .select('id')
      .eq('nonce', nonce)
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (!nonceData) {
      console.error('Nonce not found - prediction not verified');
      return new Response(
        JSON.stringify({ error: 'Prediction not verified' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Check for active prediction today
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    
    const { data: existingPrediction } = await supabase
      .from('predictions')
      .select('id')
      .eq('wallet_address', walletAddress)
      .eq('status', 'locked')
      .gte('created_at', today.toISOString())
      .maybeSingle();
      
    if (existingPrediction) {
      return new Response(
        JSON.stringify({ error: 'You already have an active prediction today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Insert prediction with service role
    const { data, error } = await supabase
      .from('predictions')
      .insert({
        wallet_address: walletAddress,
        hashed_wallet: hashedWallet,
        current_price: currentPrice,
        prediction,
        target_price: targetPrice,
        unlock_at: unlockAt,
        ipfs_url: ipfsUrl,
        status: 'locked',
        signature,
        nonce,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create prediction:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to create prediction' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Prediction created for wallet: ${walletAddress.substring(0, 4)}...`);

    return new Response(
      JSON.stringify({ success: true, prediction: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
