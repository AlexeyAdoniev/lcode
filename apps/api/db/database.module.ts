import { Module } from '@nestjs/common';
import { DatabasePool } from './pool';

@Module({
  providers: [DatabasePool],
  exports: [DatabasePool],
})
export class DatabaseModule {}
