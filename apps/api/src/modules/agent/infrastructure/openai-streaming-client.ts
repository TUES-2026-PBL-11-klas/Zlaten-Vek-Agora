import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { LLMMessage, LLMOptions } from "../domain/agent-context";
import { ILLMClient } from "../domain/i-llm-client";

@Injectable()
export class OpenAIStreamingClient implements ILLMClient {
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
    this.client = new OpenAI({ apiKey });
    this.defaultModel = this.config.get<string>("OPENAI_DEFAULT_MODEL") ?? "gpt-4o-mini";
  }

  async *streamCompletion(messages: LLMMessage[], options?: LLMOptions): AsyncIterable<string> {
    const stream = await this.client.chat.completions.create({
      model: options?.model ?? this.defaultModel,
      messages,
      stream: true,
      ...(options?.temperature !== undefined && { temperature: options.temperature }),
      ...(options?.responseFormat && { response_format: options.responseFormat }),
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content;
      if (token) yield token;
    }
  }
}
