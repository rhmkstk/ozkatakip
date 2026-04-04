import type { TenantMembershipSummary, TenantSummary } from '~/types/tenant';

export type CurrentAppUser = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	role: 'admin' | 'employee';
	is_active: boolean;
	created_at: string;
	updated_at: string;
	activeTenant: TenantSummary | null;
	memberships: TenantMembershipSummary[];
};

export function useCurrentAppUser() {
	const currentUser = useState<CurrentAppUser | null>('current-app-user', () => null);
	const loading = useState('current-app-user-loading', () => false);
	const { setActiveTenant } = useTenant();

	const loadCurrentUser = async (force = false) => {
		if (loading.value) {
			return;
		}

		if (currentUser.value && !force) {
			return;
		}

		loading.value = true;
		try {
			currentUser.value = await $fetch<CurrentAppUser>('/api/users/me');
			setActiveTenant(currentUser.value?.activeTenant ?? null);
		}
		catch (error) {
			console.error('Aktif kullanici yuklenemedi:', error);
			currentUser.value = null;
			setActiveTenant(null);
		}
		finally {
			loading.value = false;
		}
	};

	return {
		currentUser,
		loading,
		loadCurrentUser,
	};
}
