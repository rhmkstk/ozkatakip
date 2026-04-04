import { getAdminClient, requireAdminUser } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	const { currentUserId, tenant } = await requireAdminUser(event);
	const adminClient = await getAdminClient(event);
	const id = getRouterParam(event, 'id');

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Kullanici id zorunlu',
		});
	}

	if (id === currentUserId) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Aktif oturumdaki kullanici silinemez',
		});
	}

	const { data, error } = await adminClient
		.from('user_tenants')
		.update({
			is_active: false,
		})
		.eq('tenant_id', tenant.id)
		.eq('user_id', id)
		.select('role, is_active, app_users!inner(id, first_name, last_name, username, created_at, updated_at)')
		.single();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Tenant kullanicisi pasife alinamadi: ${error.message}`,
		});
	}

	return {
		id: data.app_users.id,
		first_name: data.app_users.first_name,
		last_name: data.app_users.last_name,
		username: data.app_users.username,
		role: data.role,
		is_active: data.is_active,
		created_at: data.app_users.created_at,
		updated_at: data.app_users.updated_at,
	};
});
