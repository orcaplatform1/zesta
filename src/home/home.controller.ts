import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service.js';

@Controller('home')
export class HomeController {
  constructor(private readonly home: HomeService) {}

  @Get()
  getHome() {
    return this.home.getHome();
  }
}
