import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AgentModule } from "./modules/agent/agent.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { JwtAuthGuard } from "./modules/auth/guards/jwt-auth.guard";
import { DebateModule } from "./modules/debate/debate.module";
import { HealthModule } from "./modules/health/health.module";
import { JudgeModule } from "./modules/judge/judge.module";
import { MetricsModule } from "./modules/metrics/metrics.module";
import { PersonaModule } from "./modules/persona/persona.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { RoundModule } from "./modules/round/round.module";
import { UserModule } from "./modules/user/user.module";
import { HttpMetricsInterceptor } from "./common/interceptors/http-metrics.interceptor";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MetricsModule,
    PrismaModule,
    AuthModule,
    DebateModule,
    AgentModule,
    PersonaModule,
    AnalysisModule,
    JudgeModule,
    RoundModule,
    UserModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class AppModule {}
