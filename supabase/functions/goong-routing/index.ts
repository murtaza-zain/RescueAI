import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GOONG_BASE = "https://rsapi.goong.io/v2";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { operation, params } = body;

    const goongKey = Deno.env.get("GOONG_API_KEY");

    if (!goongKey) {
      return new Response(
        JSON.stringify({ fallback: true, error: "Goong API key not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let url = "";
    switch (operation) {
      case "geocode": {
        const address = encodeURIComponent(params.address);
        url = `${GOONG_BASE}/geocode?address=${address}&api_key=${goongKey}`;
        break;
      }
      case "distanceMatrix": {
        const origins = encodeURIComponent(params.origins);
        const destinations = encodeURIComponent(params.destinations);
        const vehicle = params.vehicle || "car";
        url = `${GOONG_BASE}/distancematrix?origins=${origins}&destinations=${destinations}&vehicle=${vehicle}&api_key=${goongKey}`;
        break;
      }
      case "directions": {
        const origin = encodeURIComponent(params.origin);
        const destination = encodeURIComponent(params.destination);
        const vehicle = params.vehicle || "car";
        url = `${GOONG_BASE}/direction?origin=${origin}&destination=${destination}&vehicle=${vehicle}&api_key=${goongKey}`;
        break;
      }
      default:
        return new Response(
          JSON.stringify({ fallback: true, error: "Unknown operation" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    const goongResponse = await fetch(url);

    if (!goongResponse.ok) {
      const errText = await goongResponse.text();
      return new Response(
        JSON.stringify({ fallback: true, error: `Goong API failed: ${goongResponse.status}`, detail: errText }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await goongResponse.json();
    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ fallback: true, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
