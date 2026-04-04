import { requireAuthenticatedUserId } from '~/server/utils/user-management';
import { getAdminClient } from '~/server/utils/user-management';
import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	await requireAuthenticatedUserId(event);
	const tenant = await requireTenantContext(event);
	const adminClient = await getAdminClient(event);

	const { data, error } = await adminClient
		.from('user_tenants')
		.select('role, is_active, app_users!inner(id, first_name, last_name, username, is_active)')
		.eq('tenant_id', tenant.id)
		.order('first_name', { ascending: true, referencedTable: 'app_users' });

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici dizini alinamadi: ${error.message}`,
		});
	}

	return (data ?? []).map((item: any) => ({
		id: item.app_users.id,
		first_name: item.app_users.first_name,
		last_name: item.app_users.last_name,
		username: item.app_users.username,
		role: item.role,
		is_active: item.is_active && item.app_users.is_active,
	}));
});
