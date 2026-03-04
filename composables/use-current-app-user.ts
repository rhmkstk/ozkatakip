export type CurrentAppUser = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	role: 'admin' | 'employee';
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

export function useCurrentAppUser() {
	const currentUser = useState<CurrentAppUser | null>('current-app-user', () => null);
	const loading = useState('current-app-user-loading', () => false);

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
		}
		catch (error) {
			console.error('Aktif kullanici yuklenemedi:', error);
			currentUser.value = null;
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
