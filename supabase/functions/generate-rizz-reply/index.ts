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
    const { message, tone } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneInstructions: Record<string, string> = {
      'flirty': '😏 Romantic Lover - Generate a smooth, charming, and flirty response that makes them smile.',
      'funny': '😂 Funny Guy - Create a witty, humorous response with meme energy.',
      'teasing': '😈 Teasing Devil - Make a playful, confident, slightly risky response.',
      'dominant': '💪 Alpha - Generate a short, confident, dominant response.',
      'romantic': '❤️ Smooth Operator - Create a calm, cool, and romantic response.'
    };

    const systemPrompt = `You are RizzAI, an expert at creating attractive, confident chat responses. 
Your goal is to help users keep conversations alive and interesting.

Tone: ${toneInstructions[tone as string] || toneInstructions['flirty']}

Rules:
1. Keep responses concise (1-2 sentences max)
2. Be confident and engaging
3. Avoid being creepy or overly aggressive
4. Match the energy of the conversation
5. Create responses that invite continuation
6. No emojis in the response itself

Generate 3 different response options.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Their message: "${message}"\n\nGenerate 3 different ${tone} responses. Format as JSON: {"replies": [{"text": "...", "score": 0-100}]}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to generate responses');
    }

    const data = await response.json();
    let aiResponse = data.choices[0].message.content;
    
    // Try to parse JSON response
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      aiResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      parsedResponse = JSON.parse(aiResponse);
    } catch (e) {
      // Fallback: create structured response from plain text
      const replies = aiResponse.split('\n').filter((r: string) => r.trim()).slice(0, 3);
      parsedResponse = {
        replies: replies.map((text: string) => ({
          text: text.replace(/^\d+\.\s*/, '').trim(),
          score: Math.floor(Math.random() * 20) + 80 // Random score 80-100
        }))
      };
    }

    return new Response(JSON.stringify(parsedResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in generate-rizz-reply:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
