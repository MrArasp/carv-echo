import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Truncate wallet address for leaderboard display
 * Shows first 4 + last 4 characters of actual wallet address
 * Example: "GThu...hFMJ"
 */
const truncateWallet = (address: string | null): string => {
  if (!address || address.length < 8) return 'Unknown';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch top 10 leaderboard entries using actual wallet address
    const { data, error } = await supabase
      .from('leaderboard')
      .select('wallet_address, total_points, correct_predictions, total_predictions')
      .order('total_points', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch leaderboard' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Return leaderboard with truncated wallet addresses (first 4 + last 4 chars)
    // SECURITY: Only expose truncated addresses for privacy
    const safeLeaderboard = (data || []).map(entry => ({
      wallet_address: truncateWallet(entry.wallet_address), // Display truncated address
      total_points: entry.total_points,
      correct_predictions: entry.correct_predictions,
      total_predictions: entry.total_predictions,
    }));

    console.log(`Leaderboard fetched: ${safeLeaderboard.length} entries (truncated)`);

    return new Response(
      JSON.stringify({ leaderboard: safeLeaderboard }),
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
