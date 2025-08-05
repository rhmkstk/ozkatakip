import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export default defineEventHandler((event) => {
	const config = useRuntimeConfig();
	const token = event.node.req.headers.authorization?.split(' ')[1]; // Get Bearer token

	if (!event.context.supabase) {
		const supabase = createClient<Database>(
			config.public.supabaseUrl as string,
			config.public.supabaseKey as string,
			{
				global: {
					headers: token ? { Authorization: `Bearer ${token}` } : {}, // Set global headers if token exists
				},
			},
		);
		event.context.supabase = supabase;
	}
});
