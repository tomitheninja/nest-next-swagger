import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private logger = new Logger('Request');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, url, params, query, body } = req;
    const userAgent = req.headers['user-agent'];

    // Log the request
    this.logger.log(
      `Method: ${method} | URL: ${url} | Params: ${JSON.stringify(params)} | Query: ${JSON.stringify(query)} | Body: ${JSON.stringify(body)} | User-Agent: ${userAgent}`,
    );

    next();
  }
}
