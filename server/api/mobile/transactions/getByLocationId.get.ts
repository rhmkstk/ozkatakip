import { requireTenantContext } from '~/server/utils/tenant';
import type { MobileTransactionContext } from '~/types/mobile-transaction';

function isInSameMonth(dateInput: string | null) {
	if (!dateInput) {
		return false;
	}

	const date = new Date(dateInput);
	const now = new Date();

	return (
		date.getFullYear() === now.getFullYear()
		&& date.getMonth() === now.getMonth()
	);
}

export default defineEventHandler(async (event) => {
	try {
		const locationId = getQuery(event).location_id;
		const tenant = await requireTenantContext(event);

		if (!locationId) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

		const { data: products, error: productError } = await event.context.supabase
			.from('products')
			.select(`
				id,
				model_type,
				unit,
				current_status,
				refill_date,
				next_refill_date,
				hydrostatic_test_date,
				serial_number,
				refill_period,
				locations!inner(
					id,
					location_id,
					room,
					building_id(name)
				)
			`)
			.eq('tenant_id', tenant.id)
			.eq('locations.location_id', String(locationId))
			.limit(1);

		if (productError) {
			throw createError({
				statusCode: 500,
				message: productError.message,
			});
		}

		const product = products?.[0];

		if (!product?.locations) {
			throw createError({
				statusCode: 404,
				message: 'Product not found',
			});
		}

		const { data: inspections, error: inspectionError } = await event.context.supabase
			.from('inspections')
			.select('created_at')
			.eq('tenant_id', tenant.id)
			.eq('fire_extinguisher_id', product.id)
			.not('created_at', 'is', null)
			.order('created_at', { ascending: false })
			.limit(1);

		if (inspectionError) {
			throw createError({
				statusCode: 500,
				message: inspectionError.message,
			});
		}

		const latestInspectionCreatedAt = inspections?.[0]?.created_at ?? null;

		const response: MobileTransactionContext = {
			product: {
				id: product.id,
				model_type: product.model_type,
				unit: product.unit,
				current_status: product.current_status,
				refill_date: product.refill_date,
				next_refill_date: product.next_refill_date,
				hydrostatic_test_date: product.hydrostatic_test_date,
				serial_number: product.serial_number,
				refill_period: product.refill_period,
			},
			location: product.locations,
			latestInspection: {
				created_at: latestInspectionCreatedAt,
				is_same_month: isInSameMonth(latestInspectionCreatedAt),
			},
		};

		return response;
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
