import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Truncates a wallet address for safe display
 * Shows only first 4 and last 4 characters
 */
const truncateAddress = (address: string | null): string => {
  if (!address) return 'Unknown';
  if (address.length <= 8) return address;
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

    // Fetch top 10 leaderboard entries
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

    // Return leaderboard with truncated addresses for privacy
    const safeLeaderboard = (data || []).map(entry => ({
      wallet_address: truncateAddress(entry.wallet_address), // TRUNCATED for security
      total_points: entry.total_points,
      correct_predictions: entry.correct_predictions,
      total_predictions: entry.total_predictions,
    }));

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
