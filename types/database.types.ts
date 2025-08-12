export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
	// Allows to automatically instanciate createClient with right options
	// instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
	__InternalSupabase: {
		PostgrestVersion: '12.2.3 (519615d)';
	};
	public: {
		Tables: {
			companies: {
				Row: {
					created_at: string;
					id: number;
					name: string;
					owner: string | null;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
					owner?: string | null;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
					owner?: string | null;
				};
				Relationships: [];
			};
			fill_records: {
				Row: {
					created_at: string;
					filling: boolean;
					hose_and_nozzle: boolean | null;
					hydrostatic_pressure_test: boolean | null;
					id: number;
					manometer: boolean | null;
					paint: boolean | null;
					product_id: number | null;
					trigger_valve: boolean;
					user_id: string | null;
					wheel: boolean | null;
				};
				Insert: {
					created_at?: string;
					filling?: boolean;
					hose_and_nozzle?: boolean | null;
					hydrostatic_pressure_test?: boolean | null;
					id?: number;
					manometer?: boolean | null;
					paint?: boolean | null;
					product_id?: number | null;
					trigger_valve?: boolean;
					user_id?: string | null;
					wheel?: boolean | null;
				};
				Update: {
					created_at?: string;
					filling?: boolean;
					hose_and_nozzle?: boolean | null;
					hydrostatic_pressure_test?: boolean | null;
					id?: number;
					manometer?: boolean | null;
					paint?: boolean | null;
					product_id?: number | null;
					trigger_valve?: boolean;
					user_id?: string | null;
					wheel?: boolean | null;
				};
				Relationships: [
					{
						foreignKeyName: 'fill_records_product_id_fkey';
						columns: ['product_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					},
				];
			};
			inspections: {
				Row: {
					body: boolean | null;
					control_card: boolean | null;
					created_at: string;
					date: string | null;
					fire_extinguisher_id: number | null;
					hose_and_nozzle: boolean | null;
					id: number;
					instruction_and_label: boolean | null;
					mass: boolean | null;
					note: string | null;
					photo_url: string | null;
					pin_and_seal: boolean | null;
					position: boolean;
					pressure: boolean | null;
					result: boolean | null;
					user_id: string | null;
					working_mechanism: boolean | null;
				};
				Insert: {
					body?: boolean | null;
					control_card?: boolean | null;
					created_at?: string;
					date?: string | null;
					fire_extinguisher_id?: number | null;
					hose_and_nozzle?: boolean | null;
					id?: number;
					instruction_and_label?: boolean | null;
					mass?: boolean | null;
					note?: string | null;
					photo_url?: string | null;
					pin_and_seal?: boolean | null;
					position: boolean;
					pressure?: boolean | null;
					result?: boolean | null;
					user_id?: string | null;
					working_mechanism?: boolean | null;
				};
				Update: {
					body?: boolean | null;
					control_card?: boolean | null;
					created_at?: string;
					date?: string | null;
					fire_extinguisher_id?: number | null;
					hose_and_nozzle?: boolean | null;
					id?: number;
					instruction_and_label?: boolean | null;
					mass?: boolean | null;
					note?: string | null;
					photo_url?: string | null;
					pin_and_seal?: boolean | null;
					position?: boolean;
					pressure?: boolean | null;
					result?: boolean | null;
					user_id?: string | null;
					working_mechanism?: boolean | null;
				};
				Relationships: [
					{
						foreignKeyName: 'inspections_fire_extinguisher_id_fkey';
						columns: ['fire_extinguisher_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					},
				];
			};
			location_buildings: {
				Row: {
					created_at: string;
					id: number;
					name: string;
				};
				Insert: {
					created_at?: string;
					id?: number;
					name: string;
				};
				Update: {
					created_at?: string;
					id?: number;
					name?: string;
				};
				Relationships: [];
			};
			locations: {
				Row: {
					building_id: number;
					created_at: string;
					id: number;
					location_id: string;
					room: string;
				};
				Insert: {
					building_id: number;
					created_at?: string;
					id?: number;
					location_id: string;
					room: string;
				};
				Update: {
					building_id?: number;
					created_at?: string;
					id?: number;
					location_id?: string;
					room?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'locations_building_id_fkey';
						columns: ['building_id'];
						isOneToOne: false;
						referencedRelation: 'location_buildings';
						referencedColumns: ['id'];
					},
				];
			};
			products: {
				Row: {
					brand: string | null;
					created_at: string;
					current_status: Database['public']['Enums']['product_status'] | null;
					hydrostatic_test_date: string | null;
					id: number;
					location: number | null;
					manometer_scale_bar: number | null;
					manufacture_year: string;
					model_type: string | null;
					next_hydrostatic_test_date: string | null;
					next_refill_date: string | null;
					pressure_source: string | null;
					refill_date: string | null;
					refill_period: number | null;
					safety_valve_setting_pressure_bar: string | null;
					serial_number: number;
					test_pressure_bar: number | null;
					unit: string | null;
					working_pressure_bar: string | null;
					working_temperature_celsius: string | null;
				};
				Insert: {
					brand?: string | null;
					created_at?: string;
					current_status?: Database['public']['Enums']['product_status'] | null;
					hydrostatic_test_date?: string | null;
					id?: number;
					location?: number | null;
					manometer_scale_bar?: number | null;
					manufacture_year: string;
					model_type?: string | null;
					next_hydrostatic_test_date?: string | null;
					next_refill_date?: string | null;
					pressure_source?: string | null;
					refill_date?: string | null;
					refill_period?: number | null;
					safety_valve_setting_pressure_bar?: string | null;
					serial_number: number;
					test_pressure_bar?: number | null;
					unit?: string | null;
					working_pressure_bar?: string | null;
					working_temperature_celsius?: string | null;
				};
				Update: {
					brand?: string | null;
					created_at?: string;
					current_status?: Database['public']['Enums']['product_status'] | null;
					hydrostatic_test_date?: string | null;
					id?: number;
					location?: number | null;
					manometer_scale_bar?: number | null;
					manufacture_year?: string;
					model_type?: string | null;
					next_hydrostatic_test_date?: string | null;
					next_refill_date?: string | null;
					pressure_source?: string | null;
					refill_date?: string | null;
					refill_period?: number | null;
					safety_valve_setting_pressure_bar?: string | null;
					serial_number?: number;
					test_pressure_bar?: number | null;
					unit?: string | null;
					working_pressure_bar?: string | null;
					working_temperature_celsius?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: 'products_location_fkey';
						columns: ['location'];
						isOneToOne: false;
						referencedRelation: 'locations';
						referencedColumns: ['id'];
					},
				];
			};
			transactions: {
				Row: {
					created_at: string;
					details: string | null;
					id: number;
					product_id: number;
					type: Database['public']['Enums']['transaction_types'];
					user: string;
				};
				Insert: {
					created_at?: string;
					details?: string | null;
					id?: number;
					product_id: number;
					type: Database['public']['Enums']['transaction_types'];
					user?: string;
				};
				Update: {
					created_at?: string;
					details?: string | null;
					id?: number;
					product_id?: number;
					type?: Database['public']['Enums']['transaction_types'];
					user?: string;
				};
				Relationships: [
					{
						foreignKeyName: 'transactions_product_id_fkey';
						columns: ['product_id'];
						isOneToOne: false;
						referencedRelation: 'products';
						referencedColumns: ['id'];
					},
				];
			};
		};
		Views: {
			[_ in never]: never
		};
		Functions: {
			authorize: {
				Args: {
					requested_permission: Database['public']['Enums']['app_permission'];
				};
				Returns: boolean;
			};
			custom_access_token_hook: {
				Args: { event: Json };
				Returns: Json;
			};
		};
		Enums: {
			app_permission: 'channels.delete' | 'messages.delete';
			app_role: 'admin' | 'moderator';
			product_status: 'active' | 'damaged' | 'lost' | 'spare';
			transaction_types: 'inspection' | 'fill' | 'change' | 'other';
		};
		CompositeTypes: {
			[_ in never]: never
		};
	};
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
	DefaultSchemaTableNameOrOptions extends
	| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
		DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
			? R
			: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
		DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
			DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R;
			}
				? R
				: never
		: never;

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
	| keyof DefaultSchema['Tables']
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
		Insert: infer I;
	}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
			Insert: infer I;
		}
			? I
			: never
		: never;

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
	| keyof DefaultSchema['Tables']
	| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
		Update: infer U;
	}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
			Update: infer U;
		}
			? U
			: never
		: never;

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
	| keyof DefaultSchema['Enums']
	| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
	| keyof DefaultSchema['CompositeTypes']
	| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals;
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals;
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;

export const Constants = {
	public: {
		Enums: {
			app_permission: ['channels.delete', 'messages.delete'],
			app_role: ['admin', 'moderator'],
			product_status: ['active', 'damaged', 'lost', 'spare'],
			transaction_types: ['inspection', 'fill', 'change', 'other'],
		},
	},
} as const;
