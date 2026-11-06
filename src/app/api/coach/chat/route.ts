import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '@/lib/coach/rateLimiter';
import { z } from 'zod';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(500, 'Message cannot exceed 500 characters'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'model']),
        text: z.string().max(1000),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. IP Rate Limiting
    const clientIp =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = checkRateLimit(clientIp);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          error: `Rate limit reached. Please wait ${rateLimit.resetInSeconds} seconds before your next message.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': rateLimit.resetInSeconds.toString() },
        }
      );
    }

    // 2. Validate input
    const body = await request.json();
    const parseResult = ChatRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid message format', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { message, history } = parseResult.data;
    const apiKey = process.env.GEMINI_API_KEY;

    // 3. Fallback if no API key is provided
    if (!apiKey) {
      return NextResponse.json({
        reply: `**AI Coach Offline**: Please configure your \`GEMINI_API_KEY\` in \`.env.local\` to activate real-time form guidance.\n\nHere is a quick YouTube search for your query: [Watch Form Guides on YouTube](https://www.youtube.com/results?search_query=${encodeURIComponent(
          message + ' exercise form cues'
        )})`,
      });
    }

    // 4. Grounded System Prompt
    const systemInstruction = `You are the MyGym AI Form & Performance Coach, an evidence-based personal trainer.
Your expertise is in exercise biomechanics, setup cues, safe execution, injury substitutions, and progressive overload.

STRICT FORMATTING & OUTPUT RULES:
1. Be concise, actionable, and encouraging. Use bullet points for setup and execution.
2. Whenever you discuss or explain any exercise, include a verified YouTube search link so the user can see form demonstrations:
   Format: [Watch ${'{Exercise Name}'} Form Video](https://www.youtube.com/results?search_query=how+to+do+${'{url_encoded_exercise_name}'}+form+cues)
   NEVER generate direct video IDs (e.g. watch?v=...) because they frequently 404 or break. YouTube search URLs are guaranteed to work!
3. If the user mentions pain or an injury, immediately offer safe regression or substitute movements.
4. Keep answers under 250 words so they are mobile-friendly and fast to read.`;

    // 5. Invoke Gemini with high-speed models and strict 5-second timeout race
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    const ai = new GoogleGenAI({ apiKey });

    let replyText = '';

    for (const model of candidateModels) {
      try {
        const contents = [
          ...(history || []).map((h) => ({
            role: h.role,
            parts: [{ text: h.text }],
          })),
          {
            role: 'user',
            parts: [{ text: message }],
          },
        ];

        const generatePromise = ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.4,
          },
        });

        // 5-second timeout guard to prevent infinite browser loading
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('TIMEOUT_EXCEEDED')), 5000)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response && response.text) {
          replyText = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Chat model ${model} skipped (${err.message || err}), moving to next.`);
      }
    }

    if (!replyText) {
      // Graceful fallback if Google Gemini API hits temporary capacity limit
      const fallbackQuery = encodeURIComponent(message.slice(0, 50));
      replyText = `**Form & Technique Guide**\n\n• **Setup:** Focus on stable feet, brace core, and lock your scapulae/spine in neutral.\n• **Execution:** Control the eccentric (lowering) phase for 2-3 seconds, pause briefly, then drive explosively through concentric.\n• **Progression:** When you hit target reps across all working sets, increase weight by 2.5 kg.\n\n🎥 [Watch Form Demonstrations on YouTube](https://www.youtube.com/results?search_query=${fallbackQuery}+exercise+form+cues)`;
    }

    return NextResponse.json({ reply: replyText });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process coach query.' },
      { status: 500 }
    );
  }
}
