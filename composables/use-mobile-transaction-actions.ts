import type {
	MobileFillPayload,
	MobileInspectionPayload,
	MobileProductPatchPayload,
	MobileTransactionPayload,
} from '~/types/mobile-transaction';
import {
	isOfflineNetworkError,
	queueOfflineFillAction,
	queueOfflineInspectionAction,
	queueOfflinePhoto,
	queueOfflineProductSwitchAction,
	queueOfflineProductUpdateAction,
} from '~/utils/mobile-offline-sync';

type InspectionSubmitInput = {
	locationId: string;
	userId: string;
	inspection: Omit<MobileInspectionPayload, 'fire_extinguisher_id' | 'photo_url' | 'user_id'>;
	photoFile?: File | Blob | null;
	photoFileName?: string;
	photoFileType?: string;
};

type FillSubmitInput = {
	locationId: string;
	userId: string;
	fill: Omit<MobileFillPayload, 'product_id' | 'user_id'>;
};

type SwitchSubmitInput = {
	currentLocationId: string;
	newLocationId: string;
	details: string;
};

type ProductUpdateInput = {
	locationId?: string;
	productId?: number;
	patch: MobileProductPatchPayload;
};

async function createJsonRequest<T>(
	url: string,
	method: 'POST' | 'PUT',
	body: unknown,
	tenantSlug: string,
) {
	return await $fetch<T>(url, {
		method,
		body,
		headers: {
			'x-tenant-slug': tenantSlug,
		},
	});
}

export function useMobileTransactionActions() {
	const { activeTenantSlug } = useTenant();

	const submitInspection = async (input: InspectionSubmitInput) => {
		const tenantSlug = activeTenantSlug.value;
		if (!tenantSlug) {
			throw new Error('Missing tenant slug');
		}

		try {
			const context = await $fetch('/api/mobile/transactions/getByLocationId', {
				params: {
					location_id: input.locationId,
					tenant_slug: tenantSlug,
				},
				headers: {
					'x-tenant-slug': tenantSlug,
				},
			}) as { product?: { id?: number } };
			const productId = context.product?.id;

			if (!productId) {
				throw new Error('Missing product for inspection');
			}

			let photoPath: string | null = null;
			if (input.photoFile) {
				const formData = new FormData();
				const file = new File(
					[input.photoFile],
					input.photoFileName ?? 'inspection-photo.jpg',
					{ type: input.photoFileType ?? input.photoFile.type ?? 'image/jpeg' },
				);
				formData.append('file', file);

				const response = await fetch('/api/upload/inspection-photo', {
					method: 'POST',
					credentials: 'include',
					headers: {
						'x-tenant-slug': tenantSlug,
					},
					body: formData,
				});

				if (!response.ok) {
					throw new Error(`${response.status} ${response.statusText}`);
				}

				const result = await response.json() as { filePath?: string };
				photoPath = result.filePath ?? null;
			}

			const inspectionPayload: MobileInspectionPayload = {
				...input.inspection,
				fire_extinguisher_id: productId,
				user_id: input.userId,
				photo_url: photoPath,
			};
			await createJsonRequest('/api/inspections', 'POST', inspectionPayload, tenantSlug);

			const transactionPayload: MobileTransactionPayload = {
				type: 'inspection',
				user: input.userId,
				product_id: productId,
				details: `YSC no: ${input.locationId}`,
			};
			await createJsonRequest('/api/transactions', 'POST', transactionPayload, tenantSlug);

			return { mode: 'online' as const };
		}
		catch (error) {
			if (!isOfflineNetworkError(error)) {
				throw error;
			}

			const photoId = input.photoFile
				? await queueOfflinePhoto(
						tenantSlug,
						input.photoFile,
						input.photoFileName ?? 'inspection-photo.jpg',
						input.photoFileType ?? input.photoFile.type ?? 'image/jpeg',
					)
				: null;

			await queueOfflineInspectionAction(tenantSlug, {
				locationId: input.locationId,
				userId: input.userId,
				inspection: input.inspection,
				photoId,
			});
			return { mode: 'queued' as const };
		}
	};

	const submitFill = async (input: FillSubmitInput) => {
		const tenantSlug = activeTenantSlug.value;
		if (!tenantSlug) {
			throw new Error('Missing tenant slug');
		}

		try {
			const context = await $fetch('/api/mobile/transactions/getByLocationId', {
				params: {
					location_id: input.locationId,
					tenant_slug: tenantSlug,
				},
				headers: {
					'x-tenant-slug': tenantSlug,
				},
			}) as { product?: { id?: number; refill_period?: number | null } };
			const productId = context.product?.id;
			const refillPeriod = context.product?.refill_period || 2;

			if (!productId) {
				throw new Error('Missing product for fill');
			}

			const fillPayload: MobileFillPayload = {
				...input.fill,
				product_id: productId,
				user_id: input.userId,
			};
			await createJsonRequest('/api/fill', 'POST', fillPayload, tenantSlug);

			const now = new Date();
			const fillDate = now.toISOString().split('T')[0] ?? '';
			const nextRefillDate = new Date(now);
			nextRefillDate.setFullYear(nextRefillDate.getFullYear() + Number(refillPeriod));
			const nextHydroDate = new Date(now);
			nextHydroDate.setFullYear(nextHydroDate.getFullYear() + 4);

			const productPatchPayload: MobileProductPatchPayload = {
				id: productId,
				current_status: 'active',
				...(input.fill.filling
					? {
							refill_date: fillDate,
							next_refill_date: nextRefillDate.toISOString().split('T')[0] ?? '',
						}
					: {}),
				...(input.fill.hydrostatic_pressure_test
					? {
							hydrostatic_test_date: fillDate,
							next_hydrostatic_test_date: nextHydroDate.toISOString().split('T')[0] ?? '',
						}
					: {}),
			};
			await createJsonRequest('/api/products', 'PUT', productPatchPayload, tenantSlug);

			const transactionPayload: MobileTransactionPayload = {
				type: 'fill',
				user: input.userId,
				product_id: productId,
				details: `YSC no: ${input.locationId}`,
			};
			await createJsonRequest('/api/transactions', 'POST', transactionPayload, tenantSlug);

			return { mode: 'online' as const };
		}
		catch (error) {
			if (!isOfflineNetworkError(error)) {
				throw error;
			}

			await queueOfflineFillAction(tenantSlug, {
				locationId: input.locationId,
				userId: input.userId,
				fill: input.fill,
			});
			return { mode: 'queued' as const };
		}
	};

	const submitProductSwitch = async (input: SwitchSubmitInput) => {
		const tenantSlug = activeTenantSlug.value;
		if (!tenantSlug) {
			throw new Error('Missing tenant slug');
		}

		try {
			const [currentContext, newContext] = await Promise.all([
				$fetch('/api/mobile/transactions/getByLocationId', {
					params: {
						location_id: input.currentLocationId,
						tenant_slug: tenantSlug,
					},
					headers: {
						'x-tenant-slug': tenantSlug,
					},
				}),
				$fetch('/api/mobile/transactions/getByLocationId', {
					params: {
						location_id: input.newLocationId,
						tenant_slug: tenantSlug,
					},
					headers: {
						'x-tenant-slug': tenantSlug,
					},
				}),
			]);
			await createJsonRequest('/api/products/switch', 'POST', {
				currentProduct: (currentContext as { product: unknown }).product,
				newProduct: (newContext as { product: unknown }).product,
				details: input.details,
			}, tenantSlug);
			return { mode: 'online' as const };
		}
		catch (error) {
			if (!isOfflineNetworkError(error)) {
				throw error;
			}

			await queueOfflineProductSwitchAction(tenantSlug, input);
			return { mode: 'queued' as const };
		}
	};

	const submitProductUpdate = async (input: ProductUpdateInput) => {
		const tenantSlug = activeTenantSlug.value;
		if (!tenantSlug) {
			throw new Error('Missing tenant slug');
		}

		try {
			await createJsonRequest('/api/products', 'PUT', input.patch, tenantSlug);
			return { mode: 'online' as const };
		}
		catch (error) {
			if (!isOfflineNetworkError(error)) {
				throw error;
			}

			await queueOfflineProductUpdateAction(tenantSlug, {
				locationId: input.locationId,
				productId: input.productId,
				patch: input.patch,
			});
			return { mode: 'queued' as const };
		}
	};

	return {
		submitInspection,
		submitFill,
		submitProductSwitch,
		submitProductUpdate,
	};
}
