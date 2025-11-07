import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { walletAddress } = await req.json();

    if (!walletAddress) {
      return new Response(
        JSON.stringify({ error: 'Wallet address required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role (bypass RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if wallet already exists in leaderboard
    const { data: existing } = await supabase
      .from('leaderboard')
      .select('wallet_address')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (existing) {
      console.log(`User already initialized: ${walletAddress.substring(0, 4)}...`);
      return new Response(
        JSON.stringify({ success: true, alreadyExists: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Hash wallet address for privacy
    const encoder = new TextEncoder();
    const data = encoder.encode(walletAddress);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const hashedWallet = hashHex.substring(0, 8);

    // Insert new user with 500 welcome points
    const { error: insertError } = await supabase
      .from('leaderboard')
      .insert({
        wallet_address: walletAddress,
        hashed_wallet: hashedWallet,
        total_predictions: 0,
        correct_predictions: 0,
        total_points: 500, // Welcome bonus
      });

    if (insertError) {
      console.error('Failed to initialize user:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to initialize user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`New user initialized with 500 points: ${walletAddress.substring(0, 4)}...`);

    return new Response(
      JSON.stringify({ success: true, welcomeBonus: 500 }),
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
