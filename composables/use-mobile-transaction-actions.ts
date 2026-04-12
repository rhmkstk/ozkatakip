import type {
	MobileFillPayload,
	MobileInspectionPayload,
	MobileProductPatchPayload,
	MobileProductSwitchPayload,
	MobileTransactionPayload,
} from '~/types/mobile-transaction';

export function useMobileTransactionActions() {
	const createInspection = async (payload: MobileInspectionPayload) => {
		return await $fetch('/api/inspections', {
			method: 'POST',
			body: payload,
		});
	};

	const createFillRecord = async (payload: MobileFillPayload) => {
		return await $fetch('/api/fill', {
			method: 'POST',
			body: payload,
		});
	};

	const updateProduct = async (payload: MobileProductPatchPayload) => {
		return await $fetch('/api/products', {
			method: 'PUT',
			body: payload,
		});
	};

	const createTransaction = async (payload: MobileTransactionPayload) => {
		return await $fetch('/api/transactions', {
			method: 'POST',
			body: payload,
		});
	};

	const switchProducts = async (payload: MobileProductSwitchPayload) => {
		return await $fetch('/api/products/switch', {
			method: 'POST',
			body: payload,
		});
	};

	return {
		createInspection,
		createFillRecord,
		updateProduct,
		createTransaction,
		switchProducts,
	};
}
