import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { GoogleModule } from './modules/google/google.module';
import { TrelloModule } from './modules/trello/trello.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { UIModule } from './modules/ui/ui.module';
import { N8nModule } from './modules/n8n/n8n.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    AuthModule,
    GoogleModule,
    TrelloModule,
    WorkflowsModule,
    UIModule,
    N8nModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Middleware configuration if needed
  }
}
