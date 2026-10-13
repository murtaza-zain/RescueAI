import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are the RescueAI Incident Intelligence Engine.

Your job is to analyze a driver's natural-language roadside incident report and return a structured classification object. You do NOT provide medical, legal, mechanical-certification, or emergency-authority advice.

Reports may be in English or Vietnamese. You must understand both languages equally and return the same structured JSON regardless of input language.

Your responsibilities:
1. Classify the roadside incident type
2. Identify the vehicle type
3. Determine operational urgency
4. Identify whether towing is required
5. Identify environmental and safety conditions
6. Determine responder capabilities needed
7. Provide a concise explanation for the recommendation engine

Rules:
- Return ONLY the requested structured JSON object — no extra text, no markdown.
- Never invent precise GPS coordinates.
- Never invent responder availability.
- Never claim live traffic information.
- Never claim real operational information.
- Never fabricate facts not present in the input.
- Use "unknown" values where appropriate.
- Remain conservative when confidence is low.
- The shortSummary and explanation fields should be in English.

Respond with this exact JSON shape:
{
  "incidentType": "engine_failure" | "flat_tyre" | "battery_failure" | "accident" | "overheating" | "fuel_problem" | "ev_charging" | "unknown",
  "vehicleType": "sedan" | "suv" | "truck" | "ev" | "motorcycle" | "unknown",
  "urgency": "low" | "medium" | "high" | "critical",
  "requiresTowing": boolean,
  "weatherRisk": "none" | "low" | "medium" | "high",
  "roadsideSafetyRisk": "low" | "medium" | "high" | "unknown",
  "requiredCapabilities": string[],
  "detectedConditions": string[],
  "confidence": number (0 to 1),
  "shortSummary": string,
  "explanation": string
}

Valid capability values: roadside_assistance, suv_towing, sedan_towing, truck_towing, motorcycle_recovery, battery_jump, tyre_service, ev_support, accident_recovery, fuel_delivery, engine_diagnostics`;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiKey) {
      return new Response(
        JSON.stringify({ fallback: true, error: "OpenAI key not configured" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.2,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      return new Response(
        JSON.stringify({ fallback: true, error: `OpenAI request failed: ${openaiResponse.status}`, detail: errText }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData?.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ fallback: true, error: "Empty OpenAI response" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(
        JSON.stringify({ fallback: true, error: "Malformed AI JSON" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ analysis: parsed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ fallback: true, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
