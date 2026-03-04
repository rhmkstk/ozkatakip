import { getAdminClient, normalizeUsername } from '~/server/utils/user-management';

export default defineEventHandler(async (event) => {
	const query = getQuery(event);
	const usernameQuery = Array.isArray(query.username) ? query.username[0] : query.username;
	const username = usernameQuery ? normalizeUsername(String(usernameQuery)) : '';

	if (!username) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Kullanici adi zorunlu',
		});
	}

	const client = process.env.SUPABASE_SERVICE_KEY
		? await getAdminClient(event)
		: event.context.supabase;

	const { data, error } = await client
		.from('app_users')
		.select('id, email, role, is_active')
		.eq('username', username)
		.maybeSingle();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici bulunamadi: ${error.message}`,
		});
	}

	if (!data || !data.is_active) {
		throw createError({
			statusCode: 404,
			statusMessage: 'Kullanici adi veya sifre yanlis',
		});
	}

	return {
		id: data.id,
		email: data.email,
		role: data.role,
	};
});
