import { Module } from '@nestjs/common';
import { UIController } from './ui.controller';
import { GoogleModule } from '../google/google.module';
import { TrelloModule } from '../trello/trello.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { AuthModule } from '../auth/auth.module';
import { UsersRepository } from '../../database/repositories/users.repository';
import { EncryptionService } from '../../common/services/encryption.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    GoogleModule,
    TrelloModule,
    WorkflowsModule,
    AuthModule,
    ConfigModule,
  ],
  controllers: [UIController],
  providers: [UsersRepository, EncryptionService],
})
export class UIModule {}
