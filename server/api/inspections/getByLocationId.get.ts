import { serverSupabaseServiceRole } from '#supabase/server';
import { useRuntimeConfig } from '#imports';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export default defineEventHandler(async (event) => {
	try {
		const locationID = getQuery(event).location_id;

		if (!locationID) {
			throw createError({
				statusCode: 400,
				message: 'Missing location_id parameter',
			});
		}

			const supabase =
				process.env.SUPABASE_SERVICE_KEY
					? await serverSupabaseServiceRole<Database>(event)
					: (() => {
							const config = useRuntimeConfig(event);
							const supabaseUrl = config.supabase?.url || config.public?.supabaseUrl;
							const supabaseAnonKey = process.env.SUPABASE_KEY || config.supabase?.key || config.public?.supabaseKey;

							if (!supabaseUrl || !supabaseAnonKey) {
								throw createError({
									statusCode: 500,
									message: 'Supabase configuration is missing',
								});
							}

							return createClient<Database>(supabaseUrl, supabaseAnonKey, {
								auth: {
									persistSession: false,
								},
							});
						})();

			const { data, error } = await supabase
				.from('inspections')
			.select(`
        *,
        products!inner(
          id,
          brand,
          model_type,
          serial_number,
          unit,
          refill_date,
          next_refill_date,
          locations!inner(
            id,
            location_id,
            room,
            building_id(*)
          )
        )
      `)
				.eq('products.locations.location_id', String(locationID))
			.not('created_at', 'is', null)
			.order('created_at', { ascending: false })
			.limit(1);
		if (error) {
			throw createError({
				statusCode: 500,
				message: error.message,
			});
		}
		return data ?? [];
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
