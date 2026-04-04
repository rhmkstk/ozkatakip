import { requireAuthenticatedUserId } from '~/server/utils/user-management';
import { serverSupabaseUser } from '#supabase/server';
import { listUserTenantMemberships, resolveTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	const userId = await requireAuthenticatedUserId(event);
	const authUser = await serverSupabaseUser(event);

	const { data, error } = await event.context.supabase
		.from('app_users')
		.select('id, first_name, last_name, username, role, is_active, created_at, updated_at')
		.eq('id', userId)
		.maybeSingle();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici profili alinamadi: ${error.message}`,
		});
	}

	if (!data) {
		const metadata = authUser?.user_metadata || {};
		const memberships = await listUserTenantMemberships(event, userId);
		const resolvedTenant = await resolveTenantContext(event);
		const activeMembership = memberships.find(item => item.tenant_id === resolvedTenant?.id) ?? memberships[0] ?? null;
		return {
			id: userId,
			first_name: metadata.first_name || 'Kullanıcı',
			last_name: metadata.last_name || '',
			username: metadata.username || authUser?.email || userId,
			role: activeMembership?.role ?? (metadata.role === 'admin' ? 'admin' : 'employee'),
			is_active: true,
			created_at: authUser?.created_at || new Date().toISOString(),
			updated_at: authUser?.updated_at || new Date().toISOString(),
			activeTenant: activeMembership?.tenant ?? null,
			memberships,
		};
	}

	if (!data.is_active) {
		throw createError({
			statusCode: 403,
			statusMessage: 'Kullanici aktif degil',
		});
	}

	const memberships = await listUserTenantMemberships(event, userId);
	const resolvedTenant = await resolveTenantContext(event);
	const activeMembership = memberships.find(item => item.tenant_id === resolvedTenant?.id) ?? memberships[0] ?? null;

	return {
		...data,
		role: activeMembership?.role ?? data.role,
		activeTenant: activeMembership?.tenant ?? null,
		memberships,
	};
});
