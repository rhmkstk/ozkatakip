import { requireAuthenticatedUserId } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	await requireAuthenticatedUserId(event);

	const { data, error } = await event.context.supabase
		.from('app_users')
		.select('id, first_name, last_name, username, role, is_active')
		.order('first_name', { ascending: true });

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici dizini alinamadi: ${error.message}`,
		});
	}

	return data ?? [];
});
