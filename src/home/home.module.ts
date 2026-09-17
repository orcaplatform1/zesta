import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module.js';
import { ReviewsModule } from '../reviews/reviews.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { HomeController } from './home.controller.js';
import { HomeService } from './home.service.js';

@Module({
  imports: [ProductsModule, ReviewsModule, CategoriesModule],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
