import { Module, Controller, Get } from '@nestjs/common';


@Controller()
export class AppController {
  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [AppController],
})
export class AppModule {}
