import type { TablesInsert } from '~/types/database.types';
import type { MobileInspectionPayload } from '~/types/mobile-transaction';
import { requireTenantContext, requireTenantProduct } from '~/server/utils/tenant';

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody<MobileInspectionPayload>(event);
		const tenant = await requireTenantContext(event);

		if (body.fire_extinguisher_id) {
			await requireTenantProduct(event, body.fire_extinguisher_id);
		}

		// Validate required fields
		// if (!body.building_area || !body.location || !body.location_id) {
		//   throw createError({
		//     statusCode: 400,
		//     message: 'Missing required fields: building_area, location, and location_id are required',
		//   })
		// }

		const { data, error } = await event.context.supabase
			.from('inspections')
			.insert({
				...body,
				tenant_id: tenant.id,
			} satisfies TablesInsert<'inspections'>)
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
			const statusCode = (
				'statusCode' in error
				&& typeof error.statusCode === 'number'
			)
				? error.statusCode
				: 500;

			throw createError({
				statusCode,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
