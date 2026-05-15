import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AgentModule } from "./modules/agent/agent.module";
import { AnalysisModule } from "./modules/analysis/analysis.module";
import { AuthModule } from "./modules/auth/auth.module";
import { DebateModule } from "./modules/debate/debate.module";
import { JudgeModule } from "./modules/judge/judge.module";
import { PersonaModule } from "./modules/persona/persona.module";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { UserModule } from "./modules/user/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    DebateModule,
    AgentModule,
    PersonaModule,
    AnalysisModule,
    JudgeModule,
    UserModule,
  ],
})
export class AppModule {}
