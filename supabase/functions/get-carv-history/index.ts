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
    console.log('Fetching CARV history from Bybit...');
    
    // Fetch 24h kline data (1 hour intervals)
    const bybitUrl = 'https://api.bybit.com/v5/market/kline?category=spot&symbol=CARVUSDT&interval=60&limit=24';
    
    const response = await fetch(bybitUrl, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Bybit response:', { retCode: data.retCode, resultCount: data.result?.list?.length });

    if (data.retCode !== 0) {
      throw new Error(`Bybit API returned error code: ${data.retCode} - ${data.retMsg}`);
    }

    if (!data.result?.list || data.result.list.length === 0) {
      throw new Error('No historical data available from Bybit');
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

    console.log(`Successfully fetched ${historyData.length} data points`);

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
      JSON.stringify({ error: errorMessage, history: [] }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200, // Return 200 with empty array so UI doesn't break
      }
    );
  }
});
