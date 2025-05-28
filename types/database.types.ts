export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export type Database = {
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
			locations: {
				Row: {
					building_area: string;
					created_at: string;
					history: Json | null;
					id: number;
					location: string;
					location_id: string;
				};
				Insert: {
					building_area: string;
					created_at?: string;
					history?: Json | null;
					id?: number;
					location: string;
					location_id: string;
				};
				Update: {
					building_area?: string;
					created_at?: string;
					history?: Json | null;
					id?: number;
					location?: string;
					location_id?: string;
				};
				Relationships: [];
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
		};
		Views: {
			[_ in never]: never
		};
		Functions: {
			[_ in never]: never
		};
		Enums: {
			product_status: 'aktif' | 'arızalı' | 'kayıp' | 'yedek';
		};
		CompositeTypes: {
			[_ in never]: never
		};
	};
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
	PublicTableNameOrOptions extends
	| keyof (PublicSchema['Tables'] & PublicSchema['Views'])
	| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
			Database[PublicTableNameOrOptions['schema']]['Views'])
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
		Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R;
		}
			? R
			: never
	: PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
		PublicSchema['Views'])
		? (PublicSchema['Tables'] &
			PublicSchema['Views'])[PublicTableNameOrOptions] extends {
				Row: infer R;
			}
				? R
				: never
		: never;

export type TablesInsert<
	PublicTableNameOrOptions extends
	| keyof PublicSchema['Tables']
	| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
		Insert: infer I;
	}
		? I
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema['Tables']
		? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
			Insert: infer I;
		}
			? I
			: never
		: never;

export type TablesUpdate<
	PublicTableNameOrOptions extends
	| keyof PublicSchema['Tables']
	| { schema: keyof Database },
	TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
		: never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
	? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
		Update: infer U;
	}
		? U
		: never
	: PublicTableNameOrOptions extends keyof PublicSchema['Tables']
		? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
			Update: infer U;
		}
			? U
			: never
		: never;

export type Enums<
	PublicEnumNameOrOptions extends
	| keyof PublicSchema['Enums']
	| { schema: keyof Database },
	EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
		? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
	? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
	: PublicEnumNameOrOptions extends keyof PublicSchema['Enums']
		? PublicSchema['Enums'][PublicEnumNameOrOptions]
		: never;

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
	| keyof PublicSchema['CompositeTypes']
	| { schema: keyof Database },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof Database;
	}
		? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
	? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof PublicSchema['CompositeTypes']
		? PublicSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never;
