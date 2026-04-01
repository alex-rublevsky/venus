import { defineMiddleware } from 'astro:middleware';
import { verifyAuthCookie } from './pages/api/analytics-auth';

const ANALYTICS_SECURITY_HEADERS: Record<string, string> = {
	'X-Content-Type-Options': 'nosniff',
	'X-Frame-Options': 'DENY',
	'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export const onRequest = defineMiddleware(async (context, next) => {
	const pathname = context.url.pathname.replace(/\/+$/, '') || '/';
	const isAnalytics = pathname === '/analytics' || pathname.startsWith('/analytics/');
	const isLoginPage = pathname === '/analytics/login';
	const isAuthApi = pathname === '/api/analytics-auth';

	// Only protect /analytics (exclude /analytics/login and API)
	if (isAnalytics && !isLoginPage && !isAuthApi) {
		const cookie = context.cookies.get('analytics-auth')?.value ?? '';
		const secret = (context.locals as any).runtime?.env?.ANALYTICS_PASSWORD ?? '';
		const valid = await verifyAuthCookie(cookie, secret);
		if (!valid) {
			return new Response(null, {
				status: 302,
				headers: { Location: '/analytics/login' },
			});
		}
	}

	const response = await next();

	// Add security headers for analytics routes
	if (isAnalytics || isAuthApi) {
		const newHeaders = new Headers(response.headers);
		for (const [key, value] of Object.entries(ANALYTICS_SECURITY_HEADERS)) {
			newHeaders.set(key, value);
		}
		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: newHeaders,
		});
	}

	return response;
});
