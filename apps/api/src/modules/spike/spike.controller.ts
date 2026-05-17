import { Controller, Get, Query, Sse } from "@nestjs/common";
import { Observable } from "rxjs";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Inline type avoids conflict with the DOM global MessageEvent class.
type SseEvent = { data: string | Record<string, unknown> };

const PROBE_PROMPT =
  "In 3-4 sentences, explain why structured public debate is important in a democracy.";

@Controller("spike")
export class SpikeController {
  private readonly openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? "" });
  private readonly genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? "");

  /**
   * SSE streaming PoC endpoint.
   * GET /api/spike/stream?model=gpt5   (default)
   * GET /api/spike/stream?model=gemini
   *
   * Streams tokens as SSE events:  data: {"token":"..."}
   * Final event:                   data: {"done":true}
   */
  @Sse("stream")
  stream(@Query("model") model = "gpt5"): Observable<SseEvent> {
    return new Observable<SseEvent>(subscriber => {
      const run = async () => {
        if (model === "gemini") {
          const geminiModel = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          const result = await geminiModel.generateContentStream(PROBE_PROMPT);

          for await (const chunk of result.stream) {
            const token = chunk.text();
            if (token) subscriber.next({ data: { token } });
          }
        } else {
          const stream = await this.openai.chat.completions.create({
            model: "gpt-5",
            messages: [{ role: "user", content: PROBE_PROMPT }],
            stream: true,
          });

          for await (const chunk of stream) {
            const token = chunk.choices[0]?.delta?.content;
            if (token) subscriber.next({ data: { token } });
          }
        }

        subscriber.next({ data: { done: true } });
        subscriber.complete();
      };

      run().catch(err => subscriber.error(err as Error));
    });
  }

  /** Health-check: confirms both SDK clients initialise without crashing. */
  @Get("hello")
  hello(): { openai: string; gemini: string } {
    return {
      openai: this.openai.baseURL,
      gemini: "GoogleGenerativeAI client ready",
    };
  }
}
