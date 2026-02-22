// import { TablesInsert } from '~/types/database.types'

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
		const result = getFirstQueryValue(query.result as string | string[] | undefined);
		const yscNo = getFirstQueryValue(query.ysc_no as string | string[] | undefined);
		const createBaseRequest = () => {
			let request = event.context.supabase
				.from('inspections')
				.select('*, products!inner(brand,model_type,refill_date,unit,next_refill_date,locations!inner(*, building_id!inner(*)))')
				.order('created_at', { ascending: false });

			if (dateFrom) {
				request = request.gte('created_at', dateFrom);
			}
			if (dateTo) {
				request = request.lt('created_at', dateTo);
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
			if (result === 'true' || result === 'false') {
				request = request.eq('result', result === 'true');
			}
			return request;
		};

		const response = await createBaseRequest();
		const data = response.data;
		const error = response.error;

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
