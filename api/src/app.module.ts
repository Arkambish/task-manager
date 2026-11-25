import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule, seconds } from '@nestjs/throttler';
import { TasksModule } from './tasks/tasks.module.js';

/**
 * Each client (IP address) may call each endpoint this many times per window.
 * Normal use of the web app stays far below it; a script hammering the API
 * does not.
 * Without a limit, anyone could fill the in-memory store with tasks until the
 * process runs out of memory.
 */
export const RATE_LIMIT = { limit: 100, windowSeconds: 60 };

@Module({
  imports: [
    // Loads api/.env into the environment when the file exists. Every
    // variable has a default, so the app also starts without it.
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot({
      throttlers: [
        { limit: RATE_LIMIT.limit, ttl: seconds(RATE_LIMIT.windowSeconds) },
      ],
      // Shown to people in the web app, so it says what to do.
      errorMessage: 'Too many requests. Wait a moment, then try again.',
    }),
    TasksModule,
  ],
  providers: [
    // APP_GUARD makes the rate limit apply to every route. A request over
    // the limit is answered with 429 before it reaches a controller.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
