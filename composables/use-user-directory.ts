export type UserDirectoryItem = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	role: 'admin' | 'employee';
	is_active: boolean;
};

export function useUserDirectory() {
	const userMap = useState<Record<string, UserDirectoryItem>>('user-directory-map', () => ({}));
	const loaded = useState('user-directory-loaded', () => false);
	const loading = useState('user-directory-loading', () => false);

	const loadUserDirectory = async (force = false) => {
		if (loading.value) {
			return;
		}

		if (loaded.value && !force) {
			return;
		}

		loading.value = true;
		try {
			const data = await $fetch<UserDirectoryItem[]>('/api/users/directory');
			const nextMap: Record<string, UserDirectoryItem> = {};
			for (const user of data) {
				nextMap[user.id] = user;
			}
			userMap.value = nextMap;
			loaded.value = true;
		}
		catch (error) {
			console.error('Kullanici dizini yuklenemedi:', error);
			userMap.value = {};
			loaded.value = false;
		}
		finally {
			loading.value = false;
		}
	};

	const getUserNameById = (userId: string) => {
		const user = userMap.value[userId];
		return user ? `${user.first_name} ${user.last_name}` : userId;
	};

	return {
		userMap,
		loadUserDirectory,
		getUserNameById,
		loaded,
		loading,
	};
}
