import { Module } from '@nestjs/common';
import { TrelloService } from './trello.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [TrelloService],
  exports: [TrelloService],
})
export class TrelloModule {}
