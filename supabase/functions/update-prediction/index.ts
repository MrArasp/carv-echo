import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UpdatePredictionRequest {
  predictionId: string;
  walletAddress: string;
  finalPrice: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { predictionId, walletAddress, finalPrice }: UpdatePredictionRequest = await req.json();

    if (!predictionId || !walletAddress || !finalPrice) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the prediction
    const { data: prediction, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .eq('id', predictionId)
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError || !prediction) {
      return new Response(
        JSON.stringify({ error: 'Prediction not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Check if already revealed
    if (prediction.status !== 'locked') {
      return new Response(
        JSON.stringify({ error: 'Prediction already revealed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Determine if prediction was correct
    const targetPrice = Number(prediction.target_price);
    let isCorrect = false;
    if (prediction.prediction === 'UP') {
      isCorrect = finalPrice >= targetPrice;
    } else {
      isCorrect = finalPrice <= targetPrice;
    }

    const points = isCorrect ? 10 : -10;
    const status = isCorrect ? 'correct' : 'wrong';

    // Update prediction
    const { error: updateError } = await supabase
      .from('predictions')
      .update({
        final_price: finalPrice,
        status,
        points,
      })
      .eq('id', predictionId);

    if (updateError) {
      console.error('Failed to update prediction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update prediction' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // Update leaderboard using the existing function
    const { error: leaderboardError } = await supabase.rpc('update_leaderboard_stats', {
      p_wallet_address: walletAddress,
      p_hashed_wallet: prediction.hashed_wallet,
      p_is_correct: isCorrect,
      p_points: points,
    });

    if (leaderboardError) {
      console.error('Failed to update leaderboard:', leaderboardError);
      // Don't fail the request, prediction was still updated
    }

    console.log(`Prediction revealed for wallet ${walletAddress.substring(0, 4)}...: ${status}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        isCorrect,
        points,
        status 
      }),
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
