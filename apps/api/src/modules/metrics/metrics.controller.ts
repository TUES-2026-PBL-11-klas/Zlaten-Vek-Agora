import { Controller, Get, Res } from "@nestjs/common";
import { Response } from "express";
import { Public } from "../auth/decorators/public.decorator";
import { MetricsService } from "./metrics.service";

@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @Public()
  async getMetrics(@Res() res: Response): Promise<void> {
    const data = await this.metricsService.getMetrics();
    res.setHeader("Content-Type", this.metricsService.contentType);
    res.end(data);
  }
}
