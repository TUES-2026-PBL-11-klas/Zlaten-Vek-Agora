import { Module } from "@nestjs/common";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { SupabaseJwtStrategy, SUPABASE_STRATEGY_NAME } from "./passport/supabase-jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { UserModule } from "../user/user.module";

@Module({
  imports: [PassportModule.register({ defaultStrategy: SUPABASE_STRATEGY_NAME }), UserModule],
  controllers: [AuthController],
  providers: [AuthService, SupabaseJwtStrategy, JwtAuthGuard],
  exports: [AuthService, JwtAuthGuard, PassportModule],
})
export class AuthModule {}
