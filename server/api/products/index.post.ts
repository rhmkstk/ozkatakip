import type { TablesInsert } from '~/types/database.types';
import { requireTenantContext } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<TablesInsert<'products'>>(event);
		const tenant = await requireTenantContext(event);

		// Validate required fields
		if (!body.manufacture_year || !body.serial_number) {
			throw createError({
				statusCode: 400,
				message: 'Missing required fields: manufacture_year and serial_number are required',
			});
		}

		if (body.location) {
			const { data: location, error: locationError } = await event.context.supabase
				.from('locations')
				.select('id')
				.eq('tenant_id', tenant.id)
				.eq('id', body.location)
				.maybeSingle();

			if (locationError) {
				throw createError({
					statusCode: 500,
					message: locationError.message,
				});
			}

			if (!location) {
				throw createError({
					statusCode: 404,
					message: 'Location not found in active tenant',
				});
			}

			const { data: existing, error: existingError } = await event.context.supabase
				.from('products')
				.select('id')
				.eq('tenant_id', tenant.id)
				.eq('location', body.location)
				.limit(1)
				.maybeSingle();

			if (existingError) {
				throw createError({
					statusCode: 500,
					message: existingError.message,
				});
			}

			if (existing) {
				throw createError({
					statusCode: 409,
					message: 'This location already has a product',
				});
			}
		}

		console.log('Inserting product:', body);

		const { data, error } = await event.context.supabase
			.from('products')
			.insert({
				...body,
				tenant_id: tenant.id,
			})
			.select()
			.single();

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		return data;
	}
	catch (error: unknown) {
		console.log('ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				name: error.name,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
