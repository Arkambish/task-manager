import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';

export const DEFAULT_WEB_ORIGIN = 'http://localhost:3000';

/**
 * Everything that applies to every request. It lives in its own function
 * because the e2e tests build the app without running main.ts; calling this
 * from both places means the tests exercise the same validation and headers
 * as the real server.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(ConfigService);

  // Sets safe default response headers (no MIME sniffing, no framing, ...).
  app.use(helmet());

  // Browsers may only call this API from the listed origins. WEB_ORIGIN can
  // hold several, separated by commas.
  const allowedOrigins = config
    .get<string>('WEB_ORIGIN', DEFAULT_WEB_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins });

  app.useGlobalPipes(
    new ValidationPipe({
      // Turn the JSON body into an instance of the DTO class, which also runs
      // the @Transform decorators (trimming).
      transform: true,
      // Reject properties the DTO does not declare, with a 400. Without this
      // a client could send fields such as "id" or "createdAt".
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
}
