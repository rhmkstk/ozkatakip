import { getQuery } from 'h3';
import { requireTenantContext } from '~/server/utils/tenant';

type ProductOverviewRow = {
	id: number;
	asset_code: string;
	asset_uid: string;
	model_type: string | null;
	unit: string | null;
	current_status: string | null;
	locations: {
		location_id: string;
		room: string;
		building_id: {
			id: number;
			name: string;
		};
	};
};

type InspectionOverviewRow = {
	id: number;
	fire_extinguisher_id: number | null;
	result: boolean | null;
	created_at: string;
};

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export default defineEventHandler(async (event) => {
	const tenant = await requireTenantContext(event);
	const queryMonth = getQuery(event).month;
	const currentMonth = new Date().toISOString().slice(0, 7);
	const month = typeof queryMonth === 'string' && MONTH_PATTERN.test(queryMonth)
		? queryMonth
		: currentMonth;
	const [year, monthNumber] = month.split('-').map(Number);
	const dateFrom = `${month}-01`;
	const dateTo = new Date(Date.UTC(year, monthNumber, 1)).toISOString().slice(0, 10);

	const { data: products, error: productsError } = await event.context.supabase
		.from('products')
		.select('id, asset_code, asset_uid, model_type, unit, current_status, locations!inner(location_id, room, building_id!inner(id, name))')
		.eq('tenant_id', tenant.id)
		.eq('current_status', 'active');

	if (productsError) {
		throw createError({ statusCode: 500, message: productsError.message });
	}

	const productRows = (products ?? []) as unknown as ProductOverviewRow[];
	const productIds = productRows.map(product => product.id);
	let inspectionRows: InspectionOverviewRow[] = [];

	if (productIds.length) {
		const { data: inspections, error: inspectionsError } = await event.context.supabase
			.from('inspections')
			.select('id, fire_extinguisher_id, result, created_at')
			.eq('tenant_id', tenant.id)
			.gte('date', dateFrom)
			.lt('date', dateTo)
			.in('fire_extinguisher_id', productIds)
			.order('created_at', { ascending: false });

		if (inspectionsError) {
			throw createError({ statusCode: 500, message: inspectionsError.message });
		}

		inspectionRows = (inspections ?? []) as InspectionOverviewRow[];
	}

	const latestInspectionByProduct = new Map<number, InspectionOverviewRow>();
	for (const inspection of inspectionRows) {
		if (
			inspection.fire_extinguisher_id
			&& !latestInspectionByProduct.has(inspection.fire_extinguisher_id)
		) {
			latestInspectionByProduct.set(inspection.fire_extinguisher_id, inspection);
		}
	}

	return productRows
		.map((product) => {
			const inspection = latestInspectionByProduct.get(product.id) ?? null;
			return {
				id: product.id,
				assetCode: product.asset_code,
				assetUid: product.asset_uid,
				modelType: product.model_type,
				unit: product.unit,
				currentStatus: product.current_status,
				location: {
					locationId: product.locations.location_id,
					room: product.locations.room,
					buildingId: product.locations.building_id.id,
					buildingName: product.locations.building_id.name,
				},
				inspection: inspection
					? {
							id: inspection.id,
							result: inspection.result,
							createdAt: inspection.created_at,
						}
					: null,
			};
		})
		.sort((left, right) => {
			return left.location.buildingName.localeCompare(right.location.buildingName, 'tr')
				|| left.location.room.localeCompare(right.location.room, 'tr')
				|| left.location.locationId.localeCompare(right.location.locationId, 'tr');
		});
});
