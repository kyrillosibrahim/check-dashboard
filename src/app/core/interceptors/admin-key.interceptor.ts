import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * The dashboard authenticates client-side and does not hold a backend JWT, so it
 * authorizes admin-only endpoints with a shared `x-admin-key` header. Attached to
 * every same-origin API request; harmless on endpoints that ignore it.
 *
 * Reads also get a `_ts` cache-buster: endpoints shared with the storefront answer
 * with `Cache-Control: public, max-age=1800`, so without it the browser keeps
 * serving a pre-edit copy and a saved change looks lost until that copy expires.
 */
export const adminKeyInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith(environment.baseUrl)) {
    if (environment.adminApiKey) {
      req = req.clone({ setHeaders: { 'x-admin-key': environment.adminApiKey } });
    }
    if (req.method === 'GET') {
      req = req.clone({ setParams: { _ts: Date.now().toString() } });
    }
  }
  return next(req);
};
