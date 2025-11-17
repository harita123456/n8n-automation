import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { SessionSerializer } from './serializer';
import { UsersRepository } from '../../database/repositories/users.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'google', session: true }),
    DatabaseModule,
    ConfigModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, SessionSerializer, UsersRepository],
  exports: [AuthService],
})
export class AuthModule {}
