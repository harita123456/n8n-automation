import { Module } from '@nestjs/common';
import { GoogleService } from './google.service';
import { UsersRepository } from '../../database/repositories/users.repository';
import { DatabaseModule } from '../../database/database.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [GoogleService, UsersRepository],
  exports: [GoogleService],
})
export class GoogleModule {}
