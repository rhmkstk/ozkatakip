import { requireAdminUser } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	await requireAdminUser(event);

	const { data, error } = await event.context.supabase
		.from('app_users')
		.select('id, first_name, last_name, username, role, is_active, created_at, updated_at')
		.order('created_at', { ascending: false });

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanicilar listelenemedi: ${error.message}`,
		});
	}

	return data ?? [];
});
