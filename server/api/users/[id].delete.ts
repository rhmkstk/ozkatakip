import { getAdminClient, requireAdminUser } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	const { currentUserId } = await requireAdminUser(event);
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

	const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
		user_metadata: {
			is_active: false,
		},
	});

	if (authError) {
		throw createError({
			statusCode: 500,
			statusMessage: `Auth kullanicisi pasife alinamadi: ${authError.message}`,
		});
	}

	const { data, error } = await adminClient
		.from('app_users')
		.update({
			is_active: false,
			deleted_at: new Date().toISOString(),
		})
		.eq('id', id)
		.select('id, first_name, last_name, username, role, is_active, created_at, updated_at')
		.single();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici pasife alinamadi: ${error.message}`,
		});
	}

	return data;
});
