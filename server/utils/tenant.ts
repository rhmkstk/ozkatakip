import type { H3Event } from 'h3';
import { getHeader, getQuery } from 'h3';
import { serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server';
import type { Database } from '~/types/database.types';

export type TenantContext = {
	id: string;
	slug: string;
	name: string;
	status: string | null;
};

export type TenantMembership = {
	user_id: string;
	tenant_id: string;
	role: Database['public']['Enums']['user_role'];
	is_active: boolean;
	tenant: TenantContext;
};

const CANDIDATE_HEADER_NAMES = ['x-tenant-slug', 'x-forwarded-prefix'];

function normalizeCandidate(value: string | null | undefined) {
	const normalized = value?.trim().replace(/^\/+|\/+$/g, '');
	return normalized || null;
}

function getTenantSlugCandidate(event: H3Event) {
	for (const headerName of CANDIDATE_HEADER_NAMES) {
		const headerValue = normalizeCandidate(getHeader(event, headerName));
		if (headerValue) {
			return headerValue.split('/')[0] || null;
		}
	}

	const query = getQuery(event);
	const queryTenant = query.tenant_slug;
	if (typeof queryTenant === 'string' && queryTenant.trim()) {
		return queryTenant.trim();
	}

	const referer = getHeader(event, 'referer');
	if (!referer) {
		return null;
	}

	try {
		const refererUrl = new URL(referer);
		const [candidate] = refererUrl.pathname.split('/').filter(Boolean);
		return normalizeCandidate(candidate);
	}
	catch {
		return null;
	}
}

export async function listUserTenantMemberships(event: H3Event, userId: string) {
	if (!process.env.SUPABASE_SERVICE_KEY) {
		throw createError({
			statusCode: 500,
			statusMessage: 'SUPABASE_SERVICE_KEY tanimli degil',
		});
	}

	const adminClient = await serverSupabaseServiceRole<Database>(event);

	const { data, error } = await adminClient
		.from('user_tenants')
		.select('user_id, tenant_id, role, is_active, tenants!inner(id, slug, name, status)')
		.eq('user_id', userId)
		.eq('is_active', true);

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Tenant uyelikleri alinamadi: ${error.message}`,
		});
	}

	return (data ?? []).map((membership: any) => ({
		user_id: membership.user_id,
		tenant_id: membership.tenant_id,
		role: membership.role,
		is_active: membership.is_active,
		tenant: {
			id: membership.tenants.id,
			slug: membership.tenants.slug,
			name: membership.tenants.name,
			status: membership.tenants.status,
		},
	})) as TenantMembership[];
}

export async function resolveTenantContext(event: H3Event) {
	if (event.context.tenantResolved) {
		return event.context.tenant ?? null;
	}

	const slugCandidate = getTenantSlugCandidate(event);
	if (slugCandidate) {
		const { data, error } = await event.context.supabase
			.from('tenants')
			.select('id, slug, name, status')
			.eq('slug', slugCandidate)
			.maybeSingle();

		if (error) {
			throw createError({
				statusCode: 500,
				statusMessage: `Tenant bilgisi alinamadi: ${error.message}`,
			});
		}

		if (data) {
			event.context.tenant = data;
			event.context.tenantResolved = true;
			return data;
		}
	}

	const user = await serverSupabaseUser(event);
	if (!user) {
		event.context.tenantResolved = true;
		event.context.tenant = null;
		return null;
	}

	const memberships = await listUserTenantMemberships(event, user.id);
	if (memberships.length === 1) {
		event.context.tenant = memberships[0].tenant;
		event.context.tenantResolved = true;
		return memberships[0].tenant;
	}

	event.context.tenantResolved = true;
	event.context.tenant = null;
	return null;
}

export async function requireTenantContext(event: H3Event) {
	const tenant = await resolveTenantContext(event);

	if (!tenant) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Tenant baglami bulunamadi',
		});
	}

	return tenant;
}

export async function requireTenantMembership(
	event: H3Event,
	requiredRole?: Database['public']['Enums']['user_role'],
) {
	const user = await serverSupabaseUser(event);

	if (!user) {
		throw createError({
			statusCode: 401,
			statusMessage: 'Yetkisiz istek',
		});
	}

	const tenant = await requireTenantContext(event);
	const memberships = await listUserTenantMemberships(event, user.id);
	const membership = memberships.find(item => item.tenant_id === tenant.id);

	if (!membership) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Bu tenant icin yetkiniz yok',
		});
	}

	if (requiredRole && membership.role !== requiredRole) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Bu islem icin admin yetkisi gerekli',
		});
	}

	return {
		currentUserId: user.id,
		tenant,
		membership,
	};
}

export async function requireTenantProduct(event: H3Event, productId: number) {
	const tenant = await requireTenantContext(event);
	const { data, error } = await event.context.supabase
		.from('products')
		.select('id, tenant_id, location')
		.eq('tenant_id', tenant.id)
		.eq('id', productId)
		.maybeSingle();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Urun sorgulanamadi: ${error.message}`,
		});
	}

	if (!data) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Urun bulunamadi',
		});
	}

	return data;
}
