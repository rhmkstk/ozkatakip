import {
	createInternalEmail,
	getAdminClient,
	normalizeUsername,
	requireAdminUser,
	type AppUserRole,
} from '~/server/utils/user-management';

type CreateUserBody = {
	firstName?: string;
	lastName?: string;
	username?: string;
	password?: string;
	role?: AppUserRole;
};

export default defineEventHandler(async (event) => {
	const { tenant } = await requireAdminUser(event);
	const adminClient = await getAdminClient(event);
	const body = await readBody<CreateUserBody>(event);

	const firstName = body.firstName?.trim();
	const lastName = body.lastName?.trim();
	const username = body.username ? normalizeUsername(body.username) : '';
	const password = body.password?.trim();
	const role = body.role;

	if (!firstName || !lastName || !username || !password || (role !== 'admin' && role !== 'employee')) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ad, soyad, kullanici adi, sifre ve rol zorunludur',
		});
	}

	const { data: existingUser, error: existingUserError } = await adminClient
		.from('app_users')
		.select('id')
		.eq('username', username)
		.maybeSingle();

	if (existingUserError) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici kontrolu basarisiz: ${existingUserError.message}`,
		});
	}

	if (existingUser) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Bu kullanici adi zaten kullaniliyor',
		});
	}

	const email = createInternalEmail(username);

	const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
		email,
		password,
		email_confirm: true,
		user_metadata: {
			first_name: firstName,
			last_name: lastName,
			username,
			role,
		},
	});

	if (authError || !authData.user) {
		throw createError({
			statusCode: 500,
			statusMessage: `Auth kullanicisi olusturulamadi: ${authError?.message ?? 'bilinmeyen hata'}`,
		});
	}

	const authUserId = authData.user.id;

	const { data: appUser, error: appUserError } = await adminClient
		.from('app_users')
		.insert({
			id: authUserId,
			first_name: firstName,
			last_name: lastName,
			username,
			email,
			role,
			is_active: true,
			deleted_at: null,
		})
		.select('id, first_name, last_name, username, role, is_active, created_at, updated_at')
		.single();

	if (appUserError) {
		await adminClient.auth.admin.deleteUser(authUserId);
		throw createError({
			statusCode: 500,
			statusMessage: `Uygulama kullanicisi kaydedilemedi: ${appUserError.message}`,
		});
	}

	const { error: membershipError } = await adminClient
		.from('user_tenants')
		.insert({
			user_id: authUserId,
			tenant_id: tenant.id,
			role,
			is_active: true,
		});

	if (membershipError) {
		await adminClient.from('app_users').delete().eq('id', authUserId);
		await adminClient.auth.admin.deleteUser(authUserId);
		throw createError({
			statusCode: 500,
			statusMessage: `Tenant uyeligi kaydedilemedi: ${membershipError.message}`,
		});
	}

	return appUser;
});
