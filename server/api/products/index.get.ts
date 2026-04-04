import { getQuery } from 'h3';
import { requireTenantContext } from '~/server/utils/tenant';

const getFirstQueryValue = (value: string | string[] | undefined) =>
	Array.isArray(value) ? value[0] : value;

export default defineEventHandler(async (event) => {
	try {
		const tenant = await requireTenantContext(event);
		const query = getQuery(event);
		const building = getFirstQueryValue(query.building as string | string[] | undefined)?.trim();
		const unit = getFirstQueryValue(query.unit as string | string[] | undefined)?.trim();
		const modelType = getFirstQueryValue(query.model_type as string | string[] | undefined)?.trim();
		const brand = getFirstQueryValue(query.brand as string | string[] | undefined)?.trim();
		const manufactureYear = getFirstQueryValue(query.manufacture_year as string | string[] | undefined)?.trim();
		const refillPeriod = getFirstQueryValue(query.refill_period as string | string[] | undefined)?.trim();
		const refillDateFrom = getFirstQueryValue(query.refill_date_from as string | string[] | undefined);
		const refillDateTo = getFirstQueryValue(query.refill_date_to as string | string[] | undefined);
		const nextRefillDateFrom = getFirstQueryValue(query.next_refill_date_from as string | string[] | undefined);
		const nextRefillDateTo = getFirstQueryValue(query.next_refill_date_to as string | string[] | undefined);
		const hydroDateFrom = getFirstQueryValue(query.hydro_date_from as string | string[] | undefined);
		const hydroDateTo = getFirstQueryValue(query.hydro_date_to as string | string[] | undefined);
		const status = getFirstQueryValue(query.status as string | string[] | undefined)?.trim();
		const yscNo = getFirstQueryValue(query.ysc_no as string | string[] | undefined)?.trim();

		const { data, error } = await event.context.supabase
			.from('products')
			.select('*, locations!inner(*, building_id(*))')
			.eq('tenant_id', tenant.id)
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

		const filteredData = data.filter((item: any) => {
			const itemBuilding = item?.locations?.building_id?.name;
			const itemUnit = item?.unit;
			const itemModelType = item?.model_type;
			const itemBrand = item?.brand;
			const itemManufactureYear = item?.manufacture_year;
			const itemRefillPeriod = item?.refill_period;
			const itemRefillDate = item?.refill_date;
			const itemNextRefillDate = item?.next_refill_date;
			const itemHydroDate = item?.hydrostatic_test_date;
			const itemYscNo = item?.locations?.location_id;

			return (
				includesFilter(itemBuilding, building)
				&& includesFilter(itemUnit, unit)
				&& includesFilter(itemModelType, modelType)
				&& includesFilter(itemBrand, brand)
				&& includesFilter(itemYscNo, yscNo)
				&& equalsFilter(itemManufactureYear, manufactureYear)
				&& equalsFilter(itemRefillPeriod, refillPeriod)
				&& (!refillDateFrom || (itemRefillDate && itemRefillDate >= refillDateFrom))
				&& (!refillDateTo || (itemRefillDate && itemRefillDate < refillDateTo))
				&& (!nextRefillDateFrom || (itemNextRefillDate && itemNextRefillDate >= nextRefillDateFrom))
				&& (!nextRefillDateTo || (itemNextRefillDate && itemNextRefillDate < nextRefillDateTo))
				&& (!hydroDateFrom || (itemHydroDate && itemHydroDate >= hydroDateFrom))
				&& (!hydroDateTo || (itemHydroDate && itemHydroDate < hydroDateTo))
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
