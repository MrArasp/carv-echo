import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Fetch 24h kline data (1 hour intervals)
    const bybitUrl = 'https://api.bybit.com/v5/market/kline?category=spot&symbol=CARVUSDT&interval=60&limit=24';
    
    const response = await fetch(bybitUrl);
    const data = await response.json();

    if (data.retCode !== 0) {
      throw new Error('Failed to fetch historical data from Bybit');
    }

    // Transform Bybit kline data to our format
    // Bybit returns: [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
    const historyData = data.result.list.reverse().map((candle: any) => ({
      timestamp: parseInt(candle[0]),
      price: parseFloat(candle[4]), // close price
      open: parseFloat(candle[1]),
      high: parseFloat(candle[2]),
      low: parseFloat(candle[3]),
      volume: parseFloat(candle[5]),
    }));

    return new Response(
      JSON.stringify({ history: historyData }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error fetching CARV history:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
