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
		const unit = getFirstQueryValue(query.unit as string | string[] | undefined);
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined);
		const result = getFirstQueryValue(query.result as string | string[] | undefined);
		const createBaseRequest = () => {
			let request = event.context.supabase
				.from('inspections')
				.select('*, products!inner(brand,model_type,refill_date,unit,next_refill_date,locations!inner(*, building_id!inner(*)))')
				.order('created_at', { ascending: false });

			if (dateFrom) {
				request = request.gte('date', dateFrom);
			}
			if (dateTo) {
				request = request.lt('date', dateTo);
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
