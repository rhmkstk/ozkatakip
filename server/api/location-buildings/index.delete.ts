import { requireAdminUser } from '~/server/utils/user-management';

type DeleteBuildingBody = {
	id?: number | string;
	force?: boolean;
};

export default defineEventHandler(async (event) => {
	try {
		const { tenant } = await requireAdminUser(event);
		const body = await readBody<DeleteBuildingBody>(event);
		const rawId = body?.id;

		const buildingId
      = typeof rawId === 'string' ? Number.parseInt(rawId, 10) : rawId;

		if (!Number.isFinite(buildingId)) {
			throw createError({ statusCode: 400, message: 'Valid building id is required' });
		}

		const force = Boolean(body?.force);

		const supabase = event.context.supabase;

		const { data: building, error: buildingError } = await supabase
			.from('location_buildings')
			.select('id, name')
			.eq('tenant_id', tenant.id)
			.eq('id', buildingId)
			.maybeSingle();

		if (buildingError) {
			throw createError({
				statusCode: 500,
				message: `Failed to fetch building: ${buildingError.message}`,
			});
		}

		if (!building) {
			throw createError({ statusCode: 404, message: 'Building not found' });
		}

		const { data: locations, error: locationsError } = await supabase
			.from('locations')
			.select('id')
			.eq('tenant_id', tenant.id)
			.eq('building_id', buildingId);

		if (locationsError) {
			throw createError({
				statusCode: 500,
				message: `Failed to fetch locations: ${locationsError.message}`,
			});
		}

		const locationIds = (locations ?? []).map((item: { id: number }) => item.id);

		const { data: products, error: productsError } = locationIds.length
			? await supabase
				.from('products')
				.select('id')
				.eq('tenant_id', tenant.id)
				.in('location', locationIds)
			: { data: [], error: null };

		if (productsError) {
			throw createError({
				statusCode: 500,
				message: `Failed to fetch products: ${productsError.message}`,
			});
		}

		const productIds = (products ?? []).map((item: { id: number }) => item.id);

		const [{ count: transactionsCount, error: transactionsCountError }, { count: fillRecordsCount, error: fillRecordsCountError }, { count: inspectionsCount, error: inspectionsCountError }] = productIds.length
			? await Promise.all([
				supabase
					.from('transactions')
					.select('id', { count: 'exact', head: true })
					.eq('tenant_id', tenant.id)
					.in('product_id', productIds),
				supabase
					.from('fill_records')
					.select('id', { count: 'exact', head: true })
					.eq('tenant_id', tenant.id)
					.in('product_id', productIds),
				supabase
					.from('inspections')
					.select('id', { count: 'exact', head: true })
					.eq('tenant_id', tenant.id)
					.in('fire_extinguisher_id', productIds),
			])
			: [
					{ count: 0, error: null },
					{ count: 0, error: null },
					{ count: 0, error: null },
				];

		if (transactionsCountError || fillRecordsCountError || inspectionsCountError) {
			throw createError({
				statusCode: 500,
				message:
					transactionsCountError?.message
					|| fillRecordsCountError?.message
					|| inspectionsCountError?.message
					|| 'Failed to count related records',
			});
		}

		const relations = {
			locations: locationIds.length,
			products: productIds.length,
			transactions: transactionsCount ?? 0,
			fillRecords: fillRecordsCount ?? 0,
			inspections: inspectionsCount ?? 0,
		};

		const totalRelated = relations.locations
			+ relations.products
			+ relations.transactions
			+ relations.fillRecords
			+ relations.inspections;

		if (totalRelated > 0 && !force) {
			throw createError({
				statusCode: 409,
				message: 'Building has related data. Confirmation required.',
				data: {
					requiresConfirmation: true,
					relations,
					building,
				},
			});
		}

		let transactionsDeleted: number | null = 0;
		let fillRecordsDeleted: number | null = 0;
		let inspectionsDeleted: number | null = 0;
		let productsDeleted: number | null = 0;

		if (productIds.length) {
			const [transactionsResult, fillRecordsResult, inspectionsResult] = await Promise.all([
				supabase.from('transactions').delete({ count: 'exact' }).eq('tenant_id', tenant.id).in('product_id', productIds),
				supabase.from('fill_records').delete({ count: 'exact' }).eq('tenant_id', tenant.id).in('product_id', productIds),
				supabase.from('inspections').delete({ count: 'exact' }).eq('tenant_id', tenant.id).in('fire_extinguisher_id', productIds),
			]);

			if (transactionsResult.error || fillRecordsResult.error || inspectionsResult.error) {
				throw createError({
					statusCode: 500,
					message:
            transactionsResult.error?.message
            || fillRecordsResult.error?.message
            || inspectionsResult.error?.message
            || 'Failed to delete related records',
				});
			}

			transactionsDeleted = transactionsResult.count ?? 0;
			fillRecordsDeleted = fillRecordsResult.count ?? 0;
			inspectionsDeleted = inspectionsResult.count ?? 0;

			const { count: productsDeletedCount, error: productsDeleteError } = await supabase
				.from('products')
				.delete({ count: 'exact' })
				.eq('tenant_id', tenant.id)
				.in('id', productIds);

			if (productsDeleteError) {
				throw createError({
					statusCode: 500,
					message: `Failed to delete products: ${productsDeleteError.message}`,
				});
			}

			productsDeleted = productsDeletedCount ?? 0;
		}

		let locationsDeleted: number | null = 0;
		if (locationIds.length) {
			const { count: locationsDeletedCount, error: locationsDeleteError } = await supabase
				.from('locations')
				.delete({ count: 'exact' })
				.eq('tenant_id', tenant.id)
				.in('id', locationIds);

			if (locationsDeleteError) {
				throw createError({
					statusCode: 500,
					message: `Failed to delete locations: ${locationsDeleteError.message}`,
				});
			}

			locationsDeleted = locationsDeletedCount ?? 0;
		}

		const { count: buildingsDeleted, error: buildingDeleteError } = await supabase
			.from('location_buildings')
			.delete({ count: 'exact' })
			.eq('tenant_id', tenant.id)
			.eq('id', buildingId);

		if (buildingDeleteError) {
			throw createError({
				statusCode: 500,
				message: `Failed to delete building: ${buildingDeleteError.message}`,
			});
		}

		return {
			message: 'Building deleted successfully',
			building,
			relations,
			deleted: {
				transactions: transactionsDeleted,
				fillRecords: fillRecordsDeleted,
				inspections: inspectionsDeleted,
				products: productsDeleted,
				locations: locationsDeleted,
				buildings: buildingsDeleted ?? 0,
			},
		};
	}
	catch (error: unknown) {
		console.error('[api/location-buildings DELETE] Error:', error);

		if (error && typeof error === 'object') {
			const knownError = error as {
				statusCode?: number;
				message?: string;
				data?: unknown;
			};

			throw createError({
				statusCode: knownError.statusCode ?? 500,
				message: knownError.message ?? 'Unknown error while deleting building',
				data: knownError.data,
			});
		}

		throw createError({
			statusCode: 500,
			message: 'Unknown error while deleting building',
		});
	}
});
