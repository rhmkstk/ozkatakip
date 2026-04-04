import {
	getAdminClient,
	normalizeUsername,
	requireAdminUser,
	type AppUserRole,
} from '~/server/utils/user-management';

type UpdateUserBody = {
	firstName?: string;
	lastName?: string;
	username?: string;
	password?: string;
	role?: AppUserRole;
};

export default defineEventHandler(async (event) => {
	const { tenant } = await requireAdminUser(event);
	const adminClient = await getAdminClient(event);
	const body = await readBody<UpdateUserBody>(event);
	const id = getRouterParam(event, 'id');

	if (!id) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Kullanici id zorunlu',
		});
	}

	const firstName = body.firstName?.trim();
	const lastName = body.lastName?.trim();
	const username = body.username ? normalizeUsername(body.username) : '';
	const password = body.password?.trim();
	const role = body.role;

	if (!firstName || !lastName || !username || (role !== 'admin' && role !== 'employee')) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Ad, soyad, kullanici adi ve rol zorunludur',
		});
	}

	const { data: duplicateUser, error: duplicateError } = await adminClient
		.from('app_users')
		.select('id')
		.eq('username', username)
		.neq('id', id)
		.maybeSingle();

	if (duplicateError) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici adi kontrolu basarisiz: ${duplicateError.message}`,
		});
	}

	if (duplicateUser) {
		throw createError({
			statusCode: 409,
			statusMessage: 'Bu kullanici adi zaten kullaniliyor',
		});
	}

	const updateAuthPayload: {
		password?: string;
		user_metadata: Record<string, unknown>;
	} = {
		user_metadata: {
			first_name: firstName,
			last_name: lastName,
			username,
			role,
		},
	};

	if (password) {
		updateAuthPayload.password = password;
	}

	const { error: authError } = await adminClient.auth.admin.updateUserById(id, updateAuthPayload);

	if (authError) {
		throw createError({
			statusCode: 500,
			statusMessage: `Auth kullanicisi guncellenemedi: ${authError.message}`,
		});
	}

	const { data, error } = await adminClient
		.from('app_users')
		.update({
			first_name: firstName,
			last_name: lastName,
			username,
			role,
			is_active: true,
			deleted_at: null,
		})
		.eq('id', id)
		.select('id, first_name, last_name, username, role, is_active, created_at, updated_at')
		.single();

	if (error) {
		throw createError({
			statusCode: 500,
			statusMessage: `Kullanici guncellenemedi: ${error.message}`,
		});
	}

	const { error: membershipError } = await adminClient
		.from('user_tenants')
		.upsert({
			user_id: id,
			tenant_id: tenant.id,
			role,
			is_active: true,
		}, {
			onConflict: 'user_id,tenant_id',
		});

	if (membershipError) {
		throw createError({
			statusCode: 500,
			statusMessage: `Tenant uyeligi guncellenemedi: ${membershipError.message}`,
		});
	}

	return data;
});
