<script setup lang="ts">
// definePageMeta({
// 	middleware: 'admin',
// });

type Role = 'admin' | 'employee';

type ManagedUser = {
	id: string;
	first_name: string;
	last_name: string;
	username: string;
	role: Role;
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

const users = ref<ManagedUser[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref('');

const roleOptions = [
	{ label: 'Admin', value: 'admin' as Role },
	{ label: 'Employee', value: 'employee' as Role },
];

const createForm = reactive({
	firstName: '',
	lastName: '',
	username: '',
	password: '',
	role: 'employee' as Role,
});

const createDialogVisible = ref(false);
const editDialogVisible = ref(false);
const editTargetId = ref<string | null>(null);
const editForm = reactive({
	firstName: '',
	lastName: '',
	username: '',
	password: '',
	role: 'employee' as Role,
});

const { loadUserDirectory } = useUserDirectory();
const { loadCurrentUser } = useCurrentAppUser();
const confirm = useConfirm();
const toast = useToast();

const TURKISH_CHAR_MAP: Record<string, string> = {
	c: 'c',
	g: 'g',
	i: 'i',
	o: 'o',
	s: 's',
	u: 'u',
	C: 'c',
	G: 'g',
	I: 'i',
	O: 'o',
	S: 's',
	U: 'u',
	ç: 'c',
	ğ: 'g',
	ı: 'i',
	ö: 'o',
	ş: 's',
	ü: 'u',
	Ç: 'c',
	Ğ: 'g',
	İ: 'i',
	Ö: 'o',
	Ş: 's',
	Ü: 'u',
};

const slugifyUsernamePart = (value: string) => value
	.trim()
	.replace(/[çğıöşüÇĞIİÖŞÜ]/g, character => TURKISH_CHAR_MAP[character] ?? character)
	.normalize('NFKD')
	.replace(/[\u0300-\u036f]/g, '')
	.toLowerCase()
	.replace(/[^a-z0-9]+/g, '-')
	.replace(/^-+|-+$/g, '');

const buildUsername = (firstName: string, lastName: string) => [firstName, lastName]
	.map(slugifyUsernamePart)
	.filter(Boolean)
	.join('');

const resolveErrorMessage = (error: unknown, fallback: string) => {
	if (typeof error !== 'object' || !error) {
		return fallback;
	}

	const maybeError = error as {
		data?: {
			statusMessage?: string;
		};
	};

	return maybeError.data?.statusMessage || fallback;
};

const resetCreateForm = () => {
	createForm.firstName = '';
	createForm.lastName = '';
	createForm.username = '';
	createForm.password = '';
	createForm.role = 'employee';
};

const loadUsers = async () => {
	loading.value = true;
	errorMessage.value = '';
	try {
		users.value = await $fetch<ManagedUser[]>('/api/users');
	}
	catch (error: unknown) {
		errorMessage.value = resolveErrorMessage(error, 'Kullanıcılar yüklenemedi');
		users.value = [];
	}
	finally {
		loading.value = false;
	}
};

const createUser = async () => {
	if (!createForm.firstName || !createForm.lastName || !createForm.username || !createForm.password || !createForm.role) {
		return;
	}

	saving.value = true;
	errorMessage.value = '';
	try {
		await $fetch('/api/users', {
			method: 'POST',
			body: {
				firstName: createForm.firstName,
				lastName: createForm.lastName,
				username: createForm.username,
				password: createForm.password,
				role: createForm.role,
			},
		});

		resetCreateForm();
		createDialogVisible.value = false;
		await Promise.all([loadUsers(), loadUserDirectory(true), loadCurrentUser(true)]);
	}
	catch (error: unknown) {
		errorMessage.value = resolveErrorMessage(error, 'Kullanıcı oluşturulamadı');
	}
	finally {
		saving.value = false;
	}
};

const startEdit = (user: ManagedUser) => {
	editTargetId.value = user.id;
	editForm.firstName = user.first_name;
	editForm.lastName = user.last_name;
	editForm.username = user.username;
	editForm.password = '';
	editForm.role = user.role;
	editDialogVisible.value = true;
};

const updateUser = async () => {
	if (!editTargetId.value || !editForm.firstName || !editForm.lastName || !editForm.username || !editForm.role) {
		return;
	}

	saving.value = true;
	errorMessage.value = '';
	try {
		await $fetch(`/api/users/${editTargetId.value}`, {
			method: 'PUT',
			body: {
				firstName: editForm.firstName,
				lastName: editForm.lastName,
				username: editForm.username,
				password: editForm.password || undefined,
				role: editForm.role,
			},
		});

		editDialogVisible.value = false;
		await Promise.all([loadUsers(), loadUserDirectory(true), loadCurrentUser(true)]);
	}
	catch (error: unknown) {
		errorMessage.value = resolveErrorMessage(error, 'Kullanıcı güncellenemedi');
	}
	finally {
		saving.value = false;
	}
};

const deleteUser = (user: ManagedUser) => {
	confirm.require({
		message: `${user.first_name} ${user.last_name} kullanıcısını silmek istediğinize emin misiniz?`,
		header: 'Kullanıcı sil',
		icon: 'pi pi-exclamation-triangle',
		rejectProps: {
			label: 'Vazgeç',
			severity: 'secondary',
			outlined: true,
		},
		acceptProps: {
			label: 'Sil',
			severity: 'danger',
		},
		accept: async () => {
			saving.value = true;
			errorMessage.value = '';
			try {
				await $fetch(`/api/users/${user.id}`, { method: 'DELETE' });
				await Promise.all([loadUsers(), loadUserDirectory(true), loadCurrentUser(true)]);
			}
			catch (error: unknown) {
				errorMessage.value = resolveErrorMessage(error, 'Kullanıcı silinemedi');
			}
			finally {
				saving.value = false;
			}
		},
	});
};

const statusLabel = (isActive: boolean) => (isActive ? 'Aktif' : 'Pasif');
const roleLabel = (role: Role) => (role === 'admin' ? 'Admin' : 'Employee');

const copyUsername = async (username: string) => {
	if (!username) {
		return;
	}

	try {
		await navigator.clipboard.writeText(username);
		toast.add({
			severity: 'success',
			summary: 'Kopyalandı',
			detail: 'Kullanıcı adı panoya kopyalandı',
			life: 2000,
		});
	}
	catch {
		toast.add({
			severity: 'error',
			summary: 'Kopyalanamadı',
			detail: 'Panoya kopyalama başarısız oldu',
			life: 2500,
		});
	}
};

watch(
	() => [createForm.firstName, createForm.lastName],
	([firstName, lastName]) => {
		createForm.username = buildUsername(firstName, lastName);
	},
);

watch(
	() => [editForm.firstName, editForm.lastName],
	([firstName, lastName]) => {
		editForm.username = buildUsername(firstName, lastName);
	},
);

await loadUsers();
</script>

<template>
	<div>
		<div class="space-y-6">
			<PageHeader title="Kullanıcı yönetimi">
				<div class="ml-auto">
					<Button
						label="Yeni kullanıcı"
						icon="ri-user-add-line"
						size="small"
						@click="createDialogVisible = true"
					/>
				</div>
			</PageHeader>

			<Message
				v-if="errorMessage"
				severity="error"
				:closable="false"
			>
				{{ errorMessage }}
			</Message>

			<section class="px-4">
				<h3 class="mb-3 text-lg font-semibold">
					Mevcut kullanıcılar
				</h3>
				<div class="overflow-x-auto">
					<DataTable
						:value="users"
						:loading="loading"
						striped-rows
					>
						<Column
							field="first_name"
							header="Ad"
						/>
						<Column
							field="last_name"
							header="Soyad"
						/>
						<Column
							field="username"
							header="Kullanıcı adı"
						/>
						<Column header="Rol">
							<template #body="{ data }">
								{{ roleLabel(data.role) }}
							</template>
						</Column>
						<Column header="Durum">
							<template #body="{ data }">
								<Tag
									:value="statusLabel(data.is_active)"
									:severity="data.is_active ? 'success' : 'secondary'"
									:variant="data.is_active ? 'outlined' : undefined"
								/>
							</template>
						</Column>
						<Column header="İşlem">
							<template #body="{ data }">
								<div class="flex gap-2">
									<Button
										size="small"
										label="Güncelle"
										@click="startEdit(data)"
									/>
									<Button
										size="small"
										severity="danger"
										label="Sil"
										@click="deleteUser(data)"
									/>
								</div>
							</template>
						</Column>
					</DataTable>
				</div>
			</section>
		</div>

		<Dialog
			v-model:visible="createDialogVisible"
			modal
			header="Yeni kullanıcı oluştur"
			:style="{ width: '32rem' }"
		>
			<div class="space-y-3">
				<div class="flex flex-col gap-1">
					<label>Ad</label>
					<InputText
						v-model.trim="createForm.firstName"
						:disabled="saving"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label>Soyad</label>
					<InputText
						v-model.trim="createForm.lastName"
						:disabled="saving"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label>Kullanıcı adı</label>
					<div class="relative">
						<InputText
							v-model="createForm.username"
							class="w-full pr-10"
							disabled
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 app-icon-button transition disabled:cursor-not-allowed disabled:opacity-50"
							:disabled="!createForm.username"
							@click="copyUsername(createForm.username)"
						>
							<i class="ri-file-copy-line text-lg" />
						</button>
					</div>
				</div>
				<div class="flex flex-col gap-1">
					<label>Şifre</label>
					<Password
						v-model="createForm.password"
						:feedback="false"
						toggle-mask
						input-class="w-full"
						class="w-full"
						:disabled="saving"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label>Rol</label>
					<Select
						v-model="createForm.role"
						:options="roleOptions"
						option-label="label"
						option-value="value"
						:disabled="saving"
					/>
				</div>
			</div>

			<template #footer>
				<Button
					label="İptal"
					severity="secondary"
					text
					:disabled="saving"
					@click="createDialogVisible = false"
				/>
				<Button
					label="Kullanıcı oluştur"
					:loading="saving"
					:disabled="saving || !createForm.firstName || !createForm.lastName || !createForm.username || !createForm.password || !createForm.role"
					@click="createUser"
				/>
			</template>
		</Dialog>

		<Dialog
			v-model:visible="editDialogVisible"
			modal
			header="Kullanıcı güncelle"
			:style="{ width: '32rem' }"
		>
			<div class="space-y-3">
				<div class="flex flex-col gap-1">
					<label>Ad</label>
					<InputText v-model.trim="editForm.firstName" />
				</div>
				<div class="flex flex-col gap-1">
					<label>Soyad</label>
					<InputText v-model.trim="editForm.lastName" />
				</div>
				<div class="flex flex-col gap-1">
					<label>Kullanıcı adı</label>
					<div class="relative">
						<InputText
							v-model="editForm.username"
							class="w-full pr-10"
							disabled
						/>
						<button
							type="button"
							class="absolute right-3 top-1/2 -translate-y-1/2 app-icon-button transition disabled:cursor-not-allowed disabled:opacity-50"
							:disabled="!editForm.username"
							@click="copyUsername(editForm.username)"
						>
							<i class="ri-file-copy-line text-lg" />
						</button>
					</div>
				</div>
				<div class="flex flex-col gap-1">
					<label>Yeni şifre (opsiyonel)</label>
					<Password
						v-model="editForm.password"
						:feedback="false"
						toggle-mask
						input-class="w-full"
						class="w-full"
					/>
				</div>
				<div class="flex flex-col gap-1">
					<label>Rol</label>
					<Select
						v-model="editForm.role"
						:options="roleOptions"
						option-label="label"
						option-value="value"
					/>
				</div>
			</div>

			<template #footer>
				<Button
					label="İptal"
					severity="secondary"
					text
					@click="editDialogVisible = false"
				/>
				<Button
					label="Kaydet"
					:loading="saving"
					:disabled="saving || !editForm.firstName || !editForm.lastName || !editForm.username || !editForm.role"
					@click="updateUser"
				/>
			</template>
		</Dialog>

		<ConfirmDialog />
	</div>
</template>
