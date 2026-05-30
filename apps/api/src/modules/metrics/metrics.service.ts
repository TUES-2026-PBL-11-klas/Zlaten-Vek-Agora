import { Injectable } from "@nestjs/common";
import { Counter, Gauge, Histogram, Registry } from "prom-client";

@Injectable()
export class MetricsService {
  readonly registry: Registry;

  /** Total debates created - use rate() to compute debates/hour. */
  readonly debatesCreated: Counter;

  /** Total HTTP requests (all routes). */
  readonly httpRequestsTotal: Counter;

  /** HTTP 4xx/5xx responses, labelled by status_code. */
  readonly httpErrorsTotal: Counter<"status_code">;

  /** OpenAI streaming request duration (first byte to last token). */
  readonly openaiRequestDuration: Histogram;

  /** Currently active SSE connections. */
  readonly sseConnectionsActive: Gauge;

  /** Full debate generation duration (start to debate_complete). */
  readonly debateGenerationDuration: Histogram;

  constructor() {
    this.registry = new Registry();

    this.debatesCreated = new Counter({
      name: "agora_debates_created_total",
      help: "Total number of debates created",
      registers: [this.registry],
    });

    this.httpRequestsTotal = new Counter({
      name: "agora_http_requests_total",
      help: "Total number of HTTP requests handled",
      registers: [this.registry],
    });

    this.httpErrorsTotal = new Counter({
      name: "agora_http_errors_total",
      help: "Total number of HTTP 4xx/5xx responses",
      labelNames: ["status_code"],
      registers: [this.registry],
    });

    this.openaiRequestDuration = new Histogram({
      name: "agora_openai_request_duration_seconds",
      help: "Duration of OpenAI streaming calls from request start to last token",
      buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
      registers: [this.registry],
    });

    this.sseConnectionsActive = new Gauge({
      name: "agora_sse_connections_active",
      help: "Number of active SSE connections",
      registers: [this.registry],
    });

    this.debateGenerationDuration = new Histogram({
      name: "agora_debate_generation_duration_seconds",
      help: "Duration of a full debate session from start to debate_complete",
      buckets: [10, 30, 60, 120, 180, 300, 600],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }
}
