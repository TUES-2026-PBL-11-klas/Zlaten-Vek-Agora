import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { passportJwtSecret } from "jwks-rsa";
import { AuthenticatedUser, SupabaseJwtPayload } from "../auth.types";

export const SUPABASE_STRATEGY_NAME = "supabase";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, SUPABASE_STRATEGY_NAME) {
  constructor(config: ConfigService) {
    const supabaseUrl = config.get<string>("SUPABASE_URL");
    const legacySecret = config.get<string>("SUPABASE_JWT_SECRET");

    if (!supabaseUrl && !legacySecret) {
      throw new Error("SUPABASE_URL or SUPABASE_JWT_SECRET must be configured");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ["HS256", "RS256", "ES256"],
      secretOrKeyProvider: supabaseUrl
        ? passportJwtSecret({
            cache: true,
            rateLimit: true,
            jwksRequestsPerMinute: 10,
            jwksUri: `${supabaseUrl.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json`,
          })
        : (_req: unknown, _token: unknown, done: (err: Error | null, key?: string) => void) =>
            done(null, legacySecret!),
    });
  }

  validate(payload: SupabaseJwtPayload): AuthenticatedUser {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException("Invalid Supabase token payload");
    }

    return { userId: payload.sub, email: payload.email };
  }
}
