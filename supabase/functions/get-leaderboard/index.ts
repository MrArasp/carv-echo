import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Anonymize hashed wallet for leaderboard display
 * Takes an 8-character hash and shows first 4 + last 4
 * Example: "2f069bb5" -> "2f06...9bb5"
 */
const anonymizeHash = (hash: string | null): string => {
  if (!hash || hash.length < 8) return 'Unknown';
  // Hash is already 8 chars from SHA256, show as "xxxx...xxxx"
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
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

    // Fetch top 10 leaderboard entries using HASHED wallet only
    const { data, error } = await supabase
      .from('leaderboard')
      .select('hashed_wallet, total_points, correct_predictions, total_predictions')
      .order('total_points', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Failed to fetch leaderboard:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch leaderboard' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Return leaderboard with anonymized hashed addresses only
    // SECURITY: Never expose full wallet addresses, only truncated hashes
    const safeLeaderboard = (data || []).map(entry => ({
      wallet_address: anonymizeHash(entry.hashed_wallet), // Display anonymized hash
      total_points: entry.total_points,
      correct_predictions: entry.correct_predictions,
      total_predictions: entry.total_predictions,
    }));

    console.log(`Leaderboard fetched: ${safeLeaderboard.length} entries (anonymized)`);

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
