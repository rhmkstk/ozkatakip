import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export default defineEventHandler((event) => {
	const config = useRuntimeConfig();

	if (!event.context.supabase) {
		const supabase = createClient<Database>(
			config.public.supabaseUrl as string,
			config.public.supabaseKey as string,
		);

		// Add to event context
		event.context.supabase = supabase;
	}
});
