import { SandboxApiServer } from './grpc/sandbox-api.server';
import { Controller, Get, Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProblemModule } from './domain/problem/problem.module';
import { SolutionModule } from './domain/solution/solution.module';
import { UserModule } from './domain/user/user.module';

@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

@Module({
  imports: [ AuthModule, ProblemModule, SolutionModule, UserModule],
  controllers: [AppController],
  providers: [SandboxApiServer],
})
export class AppModule {}
