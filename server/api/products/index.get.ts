import { getQuery } from 'h3';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const query = getQuery(event);
		const building = getFirstQueryValue(query.building as string | string[] | undefined)?.trim();
		const location = getFirstQueryValue(query.location as string | string[] | undefined)?.trim();
		const yscNo = getFirstQueryValue(query.ysc_no as string | string[] | undefined)?.trim();
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined)?.trim();
		const serialNumber = getFirstQueryValue(query.serial_number as string | string[] | undefined)?.trim();
		const brand = getFirstQueryValue(query.brand as string | string[] | undefined)?.trim();
		const status = getFirstQueryValue(query.status as string | string[] | undefined)?.trim();

		const { data, error } = await event.context.supabase
			.from('products')
			.select('*, locations!inner(*, building_id(*))')
			.order('created_at', { ascending: false });

		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}

		if (!data) {
			return [];
		}

		const normalize = (value: unknown) =>
			String(value ?? '').toLocaleLowerCase('tr').trim();
		const includesFilter = (value: unknown, filterValue?: string) => {
			if (!filterValue) {
				return true;
			}
			return normalize(value).includes(normalize(filterValue));
		};
		const equalsFilter = (value: unknown, filterValue?: string) => {
			if (!filterValue) {
				return true;
			}
			return normalize(value) === normalize(filterValue);
		};

		const filteredData = data.filter((item) => {
			const itemBuilding = item?.locations?.building_id?.name;
			const itemLocation = item?.locations?.room;
			const itemYscNo = item?.locations?.location_id;
			const itemModelType = item?.model_type;
			const itemBrand = item?.brand;
			const itemSerialNumber = item?.serial_number;

			return (
				includesFilter(itemBuilding, building)
				&& includesFilter(itemLocation, location)
				&& includesFilter(itemYscNo, yscNo)
				&& includesFilter(itemModelType, modelType)
				&& includesFilter(itemBrand, brand)
				&& includesFilter(itemSerialNumber, serialNumber)
				&& equalsFilter(item?.current_status, status)
			);
		});

		return filteredData;
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
