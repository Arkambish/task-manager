import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    // Loads api/.env into the environment when the file exists. Every
    // variable has a default, so the app also starts without it.
    ConfigModule.forRoot({ isGlobal: true }),
    TasksModule,
  ],
})
export class AppModule {}
