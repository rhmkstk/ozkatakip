import { requireAdminUser } from '~/server/utils/user-management';
import { getAdminClient } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	const { tenant } = await requireAdminUser(event);
	const adminClient = await getAdminClient(event);

	const { data, error } = await adminClient
		.from('user_tenants')
		.select('user_id, role, is_active, app_users!inner(id, first_name, last_name, username, is_active, created_at, updated_at)')
		.eq('tenant_id', tenant.id)
		.order('created_at', { ascending: false, referencedTable: 'app_users' });

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanicilar listelenemedi: ${error.message}`,
		});
	}

	return (data ?? []).map((item: any) => ({
		id: item.app_users.id,
		first_name: item.app_users.first_name,
		last_name: item.app_users.last_name,
		username: item.app_users.username,
		role: item.role,
		is_active: item.is_active && item.app_users.is_active,
		created_at: item.app_users.created_at,
		updated_at: item.app_users.updated_at,
	}));
});
