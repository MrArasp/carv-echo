import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { metadata } = await req.json();
    const NFT_STORAGE_API_KEY = Deno.env.get("NFT_STORAGE_API_KEY");
    
    if (!NFT_STORAGE_API_KEY) {
      throw new Error("NFT_STORAGE_API_KEY is not configured");
    }

    // Convert metadata to Blob for nft.storage
    const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
    
    // Create form data
    const formData = new FormData();
    formData.append('file', metadataBlob, 'metadata.json');

    // Upload metadata to IPFS via nft.storage
    const nftStorageResponse = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NFT_STORAGE_API_KEY}`,
      },
      body: formData,
    });

    if (!nftStorageResponse.ok) {
      const errorText = await nftStorageResponse.text();
      console.error("nft.storage error:", nftStorageResponse.status, errorText);
      throw new Error(`Failed to upload to IPFS: ${errorText}`);
    }

    const uploadData = await nftStorageResponse.json();
    const ipfsUrl = `https://ipfs.io/ipfs/${uploadData.value.cid}`;

    console.log("IPFS upload successful:", ipfsUrl);

    return new Response(
      JSON.stringify({ 
        success: true, 
        ipfsUrl,
        cid: uploadData.value.cid 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in mint-nft function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
