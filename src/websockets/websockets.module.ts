import { Module } from '@nestjs/common';
import { WebsocketService } from './websockets.service';

@Module({
  providers: [WebsocketService],
  exports: [WebsocketService],
})
export class WebsocketModule {}
