import { createClient } from '@supabase/supabase-js';
import type { Database } from '~/types/database.types';

export default defineEventHandler((event) => {
	const config = useRuntimeConfig();
	const token = event.node.req.headers.authorization?.split(' ')[1]; // Get Bearer token

	console.log('event.node.req.headers:', event.node.req.headers.cookie);
	// console.log('Split:', event.node.req.headers.cookie?.split('base64-')[1]);
	// console.log('Supabase token:', token);

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

		// Add to event context
		event.context.supabase = supabase;
	}
});
