import type { APIRoute } from 'astro';

export const prerender = false;

const COOKIE_NAME = 'analytics-auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getPassword(locals: Record<string, any>): string {
	return locals.runtime?.env?.ANALYTICS_PASSWORD ?? '';
}

async function sign(value: string, secret: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
	const hex = [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, '0')).join('');
	return `${value}.${hex}`;
}

export async function verifyAuthCookie(cookieValue: string, secret: string): Promise<boolean> {
	if (!cookieValue || !secret) return false;
	const dot = cookieValue.lastIndexOf('.');
	if (dot === -1) return false;
	const expected = await sign(cookieValue.slice(0, dot), secret);
	return timingSafeEqual(cookieValue, expected);
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey('raw', encoder.encode('compare'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
	const [sigA, sigB] = await Promise.all([
		crypto.subtle.sign('HMAC', key, encoder.encode(a)),
		crypto.subtle.sign('HMAC', key, encoder.encode(b)),
	]);
	const viewA = new Uint8Array(sigA);
	const viewB = new Uint8Array(sigB);
	if (viewA.length !== viewB.length) return false;
	let result = 0;
	for (let i = 0; i < viewA.length; i++) result |= viewA[i] ^ viewB[i];
	return result === 0;
}

export const POST: APIRoute = async (context) => {
	const { request } = context;

	const contentType = request.headers.get('content-type') ?? '';
	if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('multipart/form-data')) {
		return new Response(null, { status: 302, headers: { Location: '/analytics/login' } });
	}

	const formData = await request.formData();
	const password = formData.get('password')?.toString()?.trim() ?? '';
	const expected = getPassword(context.locals as Record<string, any>);

	if (!expected) {
		return new Response(null, { status: 302, headers: { Location: '/analytics/login?error=config' } });
	}

	if (!(await timingSafeEqual(password, expected))) {
		return new Response(null, { status: 302, headers: { Location: '/analytics/login?error=invalid' } });
	}

	const token = await sign(String(Date.now()), expected);
	const secure = import.meta.env.PROD;
	const cookie = [
		`${COOKIE_NAME}=${token}`,
		'Path=/',
		'HttpOnly',
		'SameSite=Lax',
		`Max-Age=${COOKIE_MAX_AGE}`,
		...(secure ? ['Secure'] : []),
	].join('; ');

	return new Response(null, { status: 302, headers: { Location: '/analytics', 'Set-Cookie': cookie } });
};
