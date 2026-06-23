// backend/src/modules/content-safety/content-safety.module.ts
import { Module } from '@nestjs/common';
import { ContentSafetyService } from './content-safety.service';

@Module({
  providers: [ContentSafetyService],
  exports: [ContentSafetyService],
})
export class ContentSafetyModule {}
