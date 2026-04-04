import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const { data, error } = await event.context.supabase
			.from('transactions')
			.select('type, user')
			.eq('tenant_id', tenant.id);

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		const typeSet = new Set<string>();
		const userSet = new Set<string>();

		for (const item of data ?? []) {
			if (item?.type) {
				typeSet.add(item.type);
			}
			if (item?.user) {
				userSet.add(item.user);
			}
		}

		return {
			types: Array.from(typeSet).sort(),
			users: Array.from(userSet).sort(),
		};
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (error instanceof Error) {
			const errorWithStatus = error as Error & { statusCode?: number };
			throw createError({
				statusCode: errorWithStatus.statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
