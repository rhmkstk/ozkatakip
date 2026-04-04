export type TenantSummary = {
	id: string;
	slug: string;
	name: string;
	status: string | null;
};

export type TenantMembershipSummary = {
	tenant_id: string;
	role: 'admin' | 'employee';
	is_active: boolean;
	tenant: TenantSummary;
};
