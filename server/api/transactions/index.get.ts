// import { TablesInsert } from '~/types/database.types'
import { getQuery } from 'h3';
import { requireTenantContext } from '~/server/utils/tenant';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const query = getQuery(event);
		const dateFrom = getFirstQueryValue(query.date_from as string | string[] | undefined);
		const dateTo = getFirstQueryValue(query.date_to as string | string[] | undefined);
		const type = getFirstQueryValue(query.type as string | string[] | undefined);
		const user = getFirstQueryValue(query.user as string | string[] | undefined);

		let request = event.context.supabase
			.from('transactions')
			.select('*')
			.eq('tenant_id', tenant.id)
			.order('created_at', { ascending: false });

		if (dateFrom) {
			request = request.gte('created_at', dateFrom);
		}
		if (dateTo) {
			request = request.lt('created_at', dateTo);
		}
		if (type) {
			request = request.eq('type', type);
		}
		if (user) {
			request = request.eq('user', user);
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
