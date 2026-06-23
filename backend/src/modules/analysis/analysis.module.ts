// backend/src/modules/analysis/analysis.module.ts
import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
