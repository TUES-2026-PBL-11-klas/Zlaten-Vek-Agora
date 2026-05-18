import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { AuthenticatedUser, SupabaseJwtPayload } from "../auth.types";

export const SUPABASE_STRATEGY_NAME = "supabase";

@Injectable()
export class SupabaseJwtStrategy extends PassportStrategy(Strategy, SUPABASE_STRATEGY_NAME) {
  constructor(config: ConfigService) {
    const secret = config.get<string>("SUPABASE_JWT_SECRET");
    if (!secret) {
      throw new Error("SUPABASE_JWT_SECRET is not configured");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ["HS256"],
    });
  }

  validate(payload: SupabaseJwtPayload): AuthenticatedUser {
    if (!payload?.sub || !payload?.email) {
      throw new UnauthorizedException("Invalid Supabase token payload");
    }

    return { userId: payload.sub, email: payload.email };
  }
}
