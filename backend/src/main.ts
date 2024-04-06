import { parse } from 'node:url';
import { readFileSync, writeFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { join } from 'node:path';

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { type NextServer } from 'next/dist/server/next';
import { type OpenAPIObject } from '@nestjs/swagger';
import * as yaml from 'yaml';

import { bootstrap } from './app';

async function devMain() {
  const { app, document } = await bootstrap();

  openApiGenerator(document);

  await app.listen(process.env.PORT ?? 3300);

  app.enableCors();

  // eslint-disable-next-line no-console -- only for development
  console.log(`Application is running on: ${await app.getUrl()}`);
}

@Catch(NotFoundException)
export class FallbackToNextFilter implements ExceptionFilter {
  nextLogger = new Logger('SSR');

  constructor(public readonly next: NextServer) {}
  catch(_exception: never, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const req: Request = http.getRequest();
    const res: Response = http.getResponse();
    const url = parse(req.url, true);

    if (url.pathname?.startsWith('/api')) {
      const handler: NextFunction = http.getNext();
      handler();
    } else {
      if (!url.pathname?.startsWith('/_next')) {
        this.nextLogger.log(`Server-side rendering ${url.href}`);
      }
      const handler = this.next.getRequestHandler();
      return handler(req, res, url);
    }
  }
}

function openApiGenerator(definition: OpenAPIObject) {
  const openApiLogger = new Logger('OpenApiGenerator');
  const PATH = join(__dirname, '..', 'openapi.yaml');
  const document = yaml.stringify(definition);
  try {
    if (document === readFileSync(PATH, 'utf-8')) {
      openApiLogger.log('Skipping update of openapi.yaml');
      return;
    }
  } catch {
    openApiLogger.log('openapi.yaml does not exist, creating it');
  }

  openApiLogger.log('OpenAPI document has changed, updating openapi.yaml');
  writeFileSync(PATH, document, 'utf-8');
  exec('npm run generate:my-client', (error, stdout, stderr) => {
    if (error) {
      openApiLogger.error(
        'Error occurred while running generate:my-client:',
        error,
      );
      return;
    }
    console.log(stdout);
    console.error(stderr);
  });
  return true;
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises -- main function can't be awaited
devMain();
