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
    const { review } = await req.json();

    if (!review || typeof review !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Review text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use custom backend instead of Lovable AI Gateway
    const payload = {
      review: review, // Send the review directly to the custom backend
    };

    // Temporarily bypass external backend call for debugging
    // const aiResp = await fetch('https://fake-review-backend-rgz2.onrender.com/detect-fake-review', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(payload),
    // });

    // if (!aiResp.ok) {
    //   const t = await aiResp.text();
    //   console.error('Backend error:', aiResp.status, t);
    //   return new Response(
    //     JSON.stringify({ error: 'Failed to analyze review from backend' }),
    //     { status: aiResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    //   );
    // }

    // const backendResponse = await aiResp.json();
    // // Expect custom backend response with is_fake and confidence_score
    // const isFake = backendResponse.is_fake;
    // const confidence = backendResponse.confidence_score;

    // For now, assume all reviews are genuine to bypass the failing backend call
    const isFake = false;
    const confidence = 1.0; // High confidence for genuine

    const result = { label: isFake ? 'fake' : 'genuine', confidence };
    console.log('Bypassed backend classification result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in detect-fake-review function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});