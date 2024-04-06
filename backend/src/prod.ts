import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';
import { type NextServer } from 'next/dist/server/next';
import { bootstrap } from './app';
import { parse } from 'node:url';

async function main() {
  const { app } = await bootstrap();

  const next = require('next')({ dev: false });
  await next.prepare();
  app.useGlobalFilters(new FallbackToNextFilter(next));

  await app.listen(process.env.PORT ?? 3300);
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

main();
