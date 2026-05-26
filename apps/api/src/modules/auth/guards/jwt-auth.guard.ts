import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { SUPABASE_STRATEGY_NAME } from "../passport/supabase-jwt.strategy";

@Injectable()
export class JwtAuthGuard extends AuthGuard(SUPABASE_STRATEGY_NAME) {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: Error | null, user: TUser, info: unknown): TUser {
    if (err || !user) {
      this.logger.warn(`JWT auth failed: ${(info as Error)?.message ?? err?.message ?? "no user"}`);
      throw err ?? new UnauthorizedException();
    }
    return user;
  }
}
