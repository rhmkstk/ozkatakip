import type { Database, TablesInsert, TablesUpdate } from '~/types/database.types';

export type MobileTransactionContext = {
	product: {
		id: number;
		model_type: string | null;
		unit: string | null;
		current_status: Database['public']['Enums']['product_status'] | null;
		refill_date: string | null;
		next_refill_date: string | null;
		hydrostatic_test_date: string | null;
		serial_number: string | null;
		refill_period: number | null;
	};
	location: {
		id: number;
		location_id: string;
		room: string | null;
		building_id: {
			name: string | null;
		} | null;
	};
	latestInspection: {
		created_at: string | null;
		is_same_month: boolean;
	};
};

export type MobileTransactionProduct = MobileTransactionContext['product'];
export type MobileTransactionLocation = MobileTransactionContext['location'];
export type MobileTransactionCurrentProductData = {
	product: MobileTransactionProduct;
	location: MobileTransactionLocation;
};

export type MobileInspectionPayload = Pick<
	TablesInsert<'inspections'>,
	| 'fire_extinguisher_id'
	| 'position'
	| 'is_expiry'
	| 'body'
	| 'control_card'
	| 'hose_and_nozzle'
	| 'instruction_and_label'
	| 'mass'
	| 'pin_and_seal'
	| 'pressure'
	| 'working_mechanism'
	| 'result'
	| 'note'
	| 'photo_url'
	| 'user_id'
	| 'date'
>;

export type MobileFillPayload = Pick<
	TablesInsert<'fill_records'>,
	| 'filling'
	| 'trigger_valve'
	| 'manometer'
	| 'hose_and_nozzle'
	| 'wheel'
	| 'paint'
	| 'hydrostatic_pressure_test'
	| 'product_id'
	| 'user_id'
>;

export type MobileProductPatchPayload = Pick<
	TablesUpdate<'products'>,
	| 'id'
	| 'current_status'
	| 'refill_period'
	| 'refill_date'
	| 'next_refill_date'
	| 'hydrostatic_test_date'
	| 'next_hydrostatic_test_date'
>;

export type MobileTransactionPayload = Pick<
	TablesInsert<'transactions'>,
	| 'type'
	| 'user'
	| 'product_id'
	| 'details'
>;

export type MobileProductSwitchPayload = {
	currentProduct: MobileTransactionProduct;
	newProduct: MobileTransactionProduct;
	details: string;
};
