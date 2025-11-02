import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache
let cachedPrice: { price: number; timestamp: number } | null = null;
const CACHE_DURATION = 10000; // 10 seconds

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Return cached price if still valid
    if (cachedPrice && (now - cachedPrice.timestamp) < CACHE_DURATION) {
      console.log("Returning cached price:", cachedPrice);
      return new Response(
        JSON.stringify(cachedPrice),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch fresh price from Bybit
    console.log("Fetching fresh price from Bybit...");
    const response = await fetch(
      'https://api.bybit.com/v5/market/tickers?category=spot&symbol=CARVUSDT',
      { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse price from Bybit response
    const price = parseFloat(data?.result?.list?.[0]?.lastPrice);

    if (!price || isNaN(price)) {
      throw new Error("Invalid price data from Bybit");
    }

    // Update cache
    cachedPrice = { price, timestamp: now };
    console.log("Fresh price fetched:", cachedPrice);

    return new Response(
      JSON.stringify(cachedPrice),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching CARV price:", error);
    
    // Fallback to mock price on error
    const fallbackPrice = { price: 1.23, timestamp: Date.now() };
    console.log("Using fallback price:", fallbackPrice);
    
    return new Response(
      JSON.stringify(fallbackPrice),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
