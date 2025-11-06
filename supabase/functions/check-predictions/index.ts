import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log("Starting prediction check...");

    // 1. Find locked predictions that are past unlock time
    const { data: predictions, error: fetchError } = await supabase
      .from('predictions')
      .select('*')
      .eq('status', 'locked')
      .lte('unlock_at', new Date().toISOString());

    if (fetchError) {
      console.error("Error fetching predictions:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${predictions?.length || 0} predictions to check`);

    if (!predictions || predictions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No predictions to check' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get current price from Bybit
    const priceResponse = await supabase.functions.invoke('get-carv-price');
    const currentPrice = priceResponse.data.price;
    console.log(`Current price: ${currentPrice}`);

    let processedCount = 0;

    // 3. Process each prediction
    for (const pred of predictions) {
      console.log(`Processing prediction ${pred.id}`);
      
      const finalPrice = Number(currentPrice);
      const targetPrice = Number(pred.target_price);
      
      // Calculate if prediction was correct
      let isCorrect = false;
      if (pred.prediction === 'UP') {
        isCorrect = finalPrice >= targetPrice;
      } else {
        isCorrect = finalPrice <= targetPrice;
      }

      // Calculate points with new system: +10 for correct, -10 for wrong
      const points = isCorrect ? 10 : -10;
      const status = isCorrect ? 'correct' : 'wrong';

      console.log(`Prediction ${pred.id}: ${status}, Points: ${points}`);

      // 4. Update prediction
      const { error: updateError } = await supabase
        .from('predictions')
        .update({
          status: status,
          final_price: finalPrice,
          points: points,
          updated_at: new Date().toISOString()
        })
        .eq('id', pred.id);

      if (updateError) {
        console.error(`Error updating prediction ${pred.id}:`, updateError);
        continue;
      }

      // 5. Update leaderboard using the database function
      const { error: leaderboardError } = await supabase.rpc('update_leaderboard_stats', {
        p_wallet_address: pred.wallet_address,
        p_hashed_wallet: pred.hashed_wallet,
        p_is_correct: isCorrect,
        p_points: points
      });

      if (leaderboardError) {
        console.error(`Error updating leaderboard for ${pred.id}:`, leaderboardError);
        continue;
      }

      processedCount++;
    }

    console.log(`Successfully processed ${processedCount} predictions`);

    return new Response(
      JSON.stringify({ 
        message: 'Predictions checked',
        processed: processedCount,
        total: predictions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in check-predictions:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
