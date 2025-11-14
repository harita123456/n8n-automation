import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Suppress logging for common browser requests
    const shouldSuppress =
      request.url?.includes('.well-known') ||
      request.url?.includes('favicon.ico');

    // Log full error details to the terminal for debugging/observability
    // Prefer stack when available; otherwise log the raw exception
    // This ensures every error is visible in the terminal as requested
    if (!shouldSuppress) {
      if (exception instanceof Error) {
        console.error('[Error]', exception.message);
        if (exception.stack) {
          console.error('[Stack]', exception.stack);
        }
      } else {
        console.error('[Unknown Exception]', exception);
      }
    }

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // For SSR routes (non-API), redirect unauthorized/forbidden to login
    const isApi = request.url?.startsWith('/api');
    const wantsHtml =
      (request.headers['accept'] || '').includes('text/html') ||
      (request.headers['content-type'] || '').includes('text/html');
    if (
      !isApi &&
      wantsHtml &&
      (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN)
    ) {
      return response.redirect('/login');
    }

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
