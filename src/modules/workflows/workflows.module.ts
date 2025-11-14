import { Module } from '@nestjs/common';
import { WorkflowsService } from './workflows.service';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsRepository } from '../../database/repositories/workflows.repository';
import { CardsLogRepository } from '../../database/repositories/cards-log.repository';
import { UsersRepository } from '../../database/repositories/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { DatabaseModule } from '../../database/database.module';
import { GoogleModule } from '../google/google.module';
import { TrelloModule } from '../trello/trello.module';
import { N8nModule } from '../n8n/n8n.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DatabaseModule,
    GoogleModule,
    TrelloModule,
    N8nModule,
    ConfigModule,
  ],
  controllers: [WorkflowsController],
  providers: [
    WorkflowsService,
    WorkflowsRepository,
    CardsLogRepository,
    UsersRepository,
    EncryptionService,
  ],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
