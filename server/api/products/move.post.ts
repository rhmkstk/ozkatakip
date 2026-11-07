import { serverSupabaseServiceRole } from '#supabase/server';
import type { Database } from '~/types/database.types';
import { requireTenantMembership } from '~/server/utils/tenant';

type MoveProductBody = {
	productId?: number | string;
	buildingId?: number | string;
	room?: string;
	locationId?: string;
};

const parseRequiredId = (value: number | string | undefined) => {
	const parsedValue = typeof value === 'string' ? Number.parseInt(value, 10) : value;
	return Number.isInteger(parsedValue) && Number(parsedValue) > 0
		? Number(parsedValue)
		: null;
};

export default defineEventHandler(async (event) => {
	const { tenant } = await requireTenantMembership(event);
	const body = await readBody<MoveProductBody>(event);
	const productId = parseRequiredId(body.productId);
	const buildingId = parseRequiredId(body.buildingId);
	const room = body.room?.trim();
	const locationId = body.locationId?.trim();

	if (!productId || !buildingId || !room || !locationId) {
		throw createError({
			statusCode: 400,
			message: 'Ürün, bina, bulunduğu yer ve YSC No zorunludur.',
		});
	}

	const supabase = await serverSupabaseServiceRole<Database>(event);
	const { data: product, error: productError } = await supabase
		.from('products')
		.select('id, tenant_id, location')
		.eq('tenant_id', tenant.id)
		.eq('id', productId)
		.maybeSingle();

	if (productError) {
		throw createError({ statusCode: 500, message: productError.message });
	}

	if (!product) {
		throw createError({
			statusCode: 404,
			message: 'Tüp bu işletmede bulunamadı.',
		});
	}

	const { data: building, error: buildingError } = await supabase
		.from('location_buildings')
		.select('id')
		.eq('tenant_id', tenant.id)
		.eq('id', buildingId)
		.maybeSingle();

	if (buildingError) {
		throw createError({ statusCode: 500, message: buildingError.message });
	}

	if (!building) {
		throw createError({
			statusCode: 404,
			message: 'Seçilen bina bu işletmede bulunamadı.',
		});
	}

	const { data: existingLocation, error: locationError } = await supabase
		.from('locations')
		.select('id, building_id, room, location_id')
		.eq('tenant_id', tenant.id)
		.eq('location_id', locationId)
		.maybeSingle();

	if (locationError) {
		throw createError({ statusCode: 500, message: locationError.message });
	}

	if (existingLocation?.id === product.location) {
		const { data: updatedLocation, error: updateLocationError } = await supabase
			.from('locations')
			.update({ building_id: buildingId, room })
			.eq('tenant_id', tenant.id)
			.eq('id', existingLocation.id)
			.select('*, building_id(*)')
			.single();

		if (updateLocationError) {
			throw createError({ statusCode: 500, message: updateLocationError.message });
		}

		return { product, location: updatedLocation, created: false };
	}

	if (existingLocation) {
		const { data: occupyingProduct, error: occupyingProductError } = await supabase
			.from('products')
			.select('id')
			.eq('tenant_id', tenant.id)
			.eq('location', existingLocation.id)
			.neq('id', productId)
			.limit(1)
			.maybeSingle();

		if (occupyingProductError) {
			throw createError({ statusCode: 500, message: occupyingProductError.message });
		}

		if (occupyingProduct) {
			throw createError({
				statusCode: 409,
				message: 'Bu YSC No başka bir tüp tarafından kullanılıyor.',
			});
		}
	}

	let targetLocation = existingLocation;
	let created = false;

	if (targetLocation) {
		const { data: updatedLocation, error: updateLocationError } = await supabase
			.from('locations')
			.update({ building_id: buildingId, room })
			.eq('tenant_id', tenant.id)
			.eq('id', targetLocation.id)
			.select('id, building_id, room, location_id')
			.single();

		if (updateLocationError) {
			throw createError({ statusCode: 500, message: updateLocationError.message });
		}

		targetLocation = updatedLocation;
	}
	else {
		const { data: insertedLocation, error: insertLocationError } = await supabase
			.from('locations')
			.insert({
				tenant_id: tenant.id,
				building_id: buildingId,
				room,
				location_id: locationId,
			})
			.select('id, building_id, room, location_id')
			.single();

		if (insertLocationError) {
			throw createError({
				statusCode: insertLocationError.code === '23505' ? 409 : 500,
				message: insertLocationError.code === '23505'
					? 'Bu YSC No başka bir konum tarafından kullanılıyor.'
					: insertLocationError.message,
			});
		}

		targetLocation = insertedLocation;
		created = true;
	}

	const { data: updatedProduct, error: updateProductError } = await supabase
		.from('products')
		.update({ location: targetLocation.id })
		.eq('tenant_id', tenant.id)
		.eq('id', productId)
		.select()
		.single();

	if (updateProductError) {
		if (created) {
			await supabase
				.from('locations')
				.delete()
				.eq('tenant_id', tenant.id)
				.eq('id', targetLocation.id);
		}

		throw createError({ statusCode: 500, message: updateProductError.message });
	}

	const { data: locationWithBuilding, error: locationWithBuildingError } = await supabase
		.from('locations')
		.select('*, building_id(*)')
		.eq('tenant_id', tenant.id)
		.eq('id', targetLocation.id)
		.single();

	if (locationWithBuildingError) {
		throw createError({ statusCode: 500, message: locationWithBuildingError.message });
	}

	return {
		product: updatedProduct,
		location: locationWithBuilding,
		created,
	};
});
