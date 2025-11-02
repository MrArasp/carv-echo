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
    const { metadata, signature, nonce, signedMessage } = await req.json();
    const NFT_STORAGE_API_KEY = Deno.env.get("NFT_STORAGE_API_KEY");
    
    if (!NFT_STORAGE_API_KEY) {
      console.log("NFT_STORAGE_API_KEY not configured, skipping IPFS upload");
      return new Response(
        JSON.stringify({ 
          success: true, 
          ipfsUrl: null,
          message: "Prediction saved without IPFS (API key not configured)" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Uploading to IPFS with metadata:", metadata);

    // Add signature verification data to metadata if provided
    const enrichedMetadata = signature && nonce ? {
      ...metadata,
      signature,
      nonce,
      signedMessage,
      verifier: 'CARV SVM',
      wallet_verified: true,
    } : metadata;

    // Convert metadata to Blob for nft.storage
    const metadataBlob = new Blob([JSON.stringify(enrichedMetadata)], { type: 'application/json' });
    
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
      
      // Return success but without IPFS URL if upload fails
      return new Response(
        JSON.stringify({ 
          success: true, 
          ipfsUrl: null,
          message: "Prediction saved without IPFS (upload failed)",
          error: errorText
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
    
    // Return success without IPFS on error
    return new Response(
      JSON.stringify({ 
        success: true,
        ipfsUrl: null,
        message: "Prediction saved without IPFS (error occurred)",
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
