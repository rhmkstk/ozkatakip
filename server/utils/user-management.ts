import type { H3Event } from 'h3';
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';

export type AppUserRole = 'admin' | 'employee';

export type AppUserRow = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	email: string;
	role: AppUserRole;
	is_active: boolean;
	created_at: string;
	updated_at: string;
	deleted_at: string | null;
};

export async function getAdminClient(event: H3Event) {
	if (!process.env.SUPABASE_SERVICE_KEY) {
		throw createError({
			statusCode: 500,
			statusMessage: 'SUPABASE_SERVICE_KEY tanimli degil',
		});
	}

	return serverSupabaseServiceRole<Database>(event);
}

export async function requireAuthenticatedUserId(event: H3Event) {
	const user = await serverSupabaseUser(event);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Yetkisiz istek',
		});
	}

	return user.id;
}

export async function requireAdminUser(event: H3Event) {
	const currentUserId = await requireAuthenticatedUserId(event);

	const { data, error } = await event.context.supabase
		.from('app_users')
		.select('role, is_active')
		.eq('id', currentUserId)
		.maybeSingle();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici yetkisi okunamadi: ${error.message}`,
		});
	}

	if (!data || !data.is_active || data.role !== 'admin') {
		throw createError({
			statusCode: 403,
			statusMessage: 'Bu islem icin admin yetkisi gerekli',
		});
	}

	return {
		currentUserId,
	};
}

export function normalizeUsername(value: string) {
	return value.trim().toLowerCase();
}

export function createInternalEmail(username: string) {
	const safePart = username
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-zA-Z0-9._-]/g, '');

	const uniquePart = crypto.randomUUID().slice(0, 8);

	return `${safePart || 'user'}.${uniquePart}@internal.local`;
}
