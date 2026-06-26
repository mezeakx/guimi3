import { Injectable, NestInterceptor, ExecutionContext, CallHandler, RequestTimeoutException, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TimeoutInterceptor.name);
  private readonly timeoutMs = 120000; // 120秒，因为 AI 调用可能较慢

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      timeout(this.timeoutMs),
      catchError(err => {
        if (err instanceof RequestTimeoutException) {
          this.logger.error('请求超时');
          return throwError(() => new RequestTimeoutException('请求处理超时，请稍后重试'));
        }
        return throwError(() => err);
      }),
    );
  }
}
