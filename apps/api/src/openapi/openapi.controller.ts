import { Controller, Get } from '@nestjs/common';
import { OpenApiService } from './openapi.service.js';

@Controller()
export class OpenApiController {
  constructor(private readonly openApi: OpenApiService) {}

  @Get('openapi.json')
  document() {
    return this.openApi.getDocument();
  }
}
