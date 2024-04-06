import { parse } from 'node:url';

import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { type NextServer } from 'next/dist/server/next';

import { bootstrap } from './app';

async function devMain() {
  const { app } = await bootstrap();

  const next = require('next')({ dev: true });
  await next.prepare();
  app.useGlobalFilters(new FallbackToNextFilter(next));

  await app.listen(process.env.PORT ?? 3000);

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

// eslint-disable-next-line @typescript-eslint/no-floating-promises -- main function can't be awaited
devMain();
