import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../../db/database.module';
import { AuthModule } from '../../auth/auth.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, DatabaseModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
