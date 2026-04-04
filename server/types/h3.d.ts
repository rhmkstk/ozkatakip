import 'h3';
import type { TenantContext } from '~/server/utils/tenant';

declare module 'h3' {
	interface H3EventContext {
		supabase: any;
		tenant?: TenantContext | null;
		tenantResolved?: boolean;
	}
}

export {};
