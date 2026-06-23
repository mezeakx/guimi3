import { Module, Provider } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client';

const prismaClientProvider: Provider = {
  provide: PrismaClient,
  useValue: new PrismaClient(),
};

@Module({
  controllers: [UserController],
  providers: [UserService, prismaClientProvider],
  exports: [UserService, prismaClientProvider],
})
export class UserModule {}
