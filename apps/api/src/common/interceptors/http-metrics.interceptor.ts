import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, catchError, tap, throwError } from "rxjs";
import { MetricsService } from "../../modules/metrics/metrics.service";

@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    this.metrics.httpRequestsTotal.inc();

    return next.handle().pipe(
      // tap fires once per emitted value; for REST responses that is exactly once.
      // SSE observables are not counted again here because the counter was already
      // incremented above at request entry.
      tap({ error: () => {} }),
      catchError((err: unknown) => {
        const statusCode = err instanceof HttpException ? err.getStatus() : 500;
        if (statusCode >= 400) {
          this.metrics.httpErrorsTotal.inc({ status_code: String(statusCode) });
        }
        return throwError(() => err);
      }),
    );
  }
}
