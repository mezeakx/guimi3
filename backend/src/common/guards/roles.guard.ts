import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requiredRole = request.route.metadata['role'];
    if (!requiredRole) return true;
    return request.user?.role === requiredRole;
  }
}
