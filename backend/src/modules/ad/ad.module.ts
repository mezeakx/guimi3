// backend/src/modules/ad/ad.module.ts
import { Module } from '@nestjs/common';
import { AdController } from './ad.controller';
import { AdService } from './ad.service';

@Module({
  controllers: [AdController],
  providers: [AdService],
})
export class AdModule {}
