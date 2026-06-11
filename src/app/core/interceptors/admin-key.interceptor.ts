import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * The dashboard authenticates client-side and does not hold a backend JWT, so it
 * authorizes admin-only endpoints with a shared `x-admin-key` header. Attached to
 * every same-origin API request; harmless on endpoints that ignore it.
 */
export const adminKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (environment.adminApiKey && req.url.startsWith(environment.baseUrl)) {
    req = req.clone({ setHeaders: { 'x-admin-key': environment.adminApiKey } });
  }
  return next(req);
};
