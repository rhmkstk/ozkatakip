import { getQuery } from 'h3';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const fillDateFrom = getFirstQueryValue(query.fill_date_from as string | string[] | undefined);
		const fillDateTo = getFirstQueryValue(query.fill_date_to as string | string[] | undefined);
		const hydroDateFrom = getFirstQueryValue(query.hydro_date_from as string | string[] | undefined);
		const hydroDateTo = getFirstQueryValue(query.hydro_date_to as string | string[] | undefined);
		const building = getFirstQueryValue(query.building as string | string[] | undefined);
		const unit = getFirstQueryValue(query.unit as string | string[] | undefined);
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined);
		const yscNo = getFirstQueryValue(query.ysc_no as string | string[] | undefined);

		let request = event.context.supabase
			.from('fill_records')
			.select('*, products!inner(brand, model_type, unit, refill_date, hydrostatic_test_date, next_refill_date, locations!inner(*, building_id!inner(*)))');

		if (fillDateFrom) {
			request = request.gte('products.refill_date', fillDateFrom);
		}
		if (fillDateTo) {
			request = request.lt('products.refill_date', fillDateTo);
		}
		if (hydroDateFrom) {
			request = request.gte('products.hydrostatic_test_date', hydroDateFrom);
		}
		if (hydroDateTo) {
			request = request.lt('products.hydrostatic_test_date', hydroDateTo);
		}
		if (building) {
			request = request.ilike('products.locations.building_id.name', `%${building}%`);
		}
		if (unit) {
			request = request.ilike('products.unit', `%${unit}%`);
		}
		if (modelType) {
			request = request.ilike('products.model_type', `%${modelType}%`);
		}
		if (yscNo) {
			request = request.ilike('products.locations.location_id', `%${yscNo}%`);
		}

		const { data, error } = await request;

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		return data;
	}
	catch (error: unknown) {
		console.error('ERROR:', error);
		if (error instanceof Error) {
			throw createError({
				statusCode: error.statusCode || 500,
				message: error.message,
			});
		}
		throw createError({
			statusCode: 500,
			message: 'An unknown error occurred',
		});
	}
});
