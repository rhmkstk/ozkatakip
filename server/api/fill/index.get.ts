import { getQuery } from 'h3';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const dateFrom = getFirstQueryValue(query.date_from as string | string[] | undefined);
		const dateTo = getFirstQueryValue(query.date_to as string | string[] | undefined);
		const building = getFirstQueryValue(query.building as string | string[] | undefined);
		const location = getFirstQueryValue(query.location as string | string[] | undefined);
		const yscNo = getFirstQueryValue(query.ysc_no as string | string[] | undefined);
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined);

		let request = event.context.supabase
			.from('fill_records')
			.select('*, products!inner(brand, model_type, unit, refill_date, next_refill_date, locations!inner(*, building_id!inner(*)))');

		if (dateFrom) {
			request = request.gte('products.refill_date', dateFrom);
		}
		if (dateTo) {
			request = request.lt('products.refill_date', dateTo);
		}
		if (building) {
			request = request.ilike('products.locations.building_id.name', `%${building}%`);
		}
		if (location) {
			request = request.ilike('products.locations.room', `%${location}%`);
		}
		if (yscNo) {
			request = request.ilike('products.locations.location_id', `%${yscNo}%`);
		}
		if (modelType) {
			request = request.ilike('products.model_type', `%${modelType}%`);
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
