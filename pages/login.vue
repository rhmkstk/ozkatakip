<script setup lang="ts">
import type { AuthError } from '@supabase/supabase-js';
import type { CurrentAppUser } from '~/composables/use-current-app-user';
import type { TenantSummary } from '~/types/tenant';

definePageMeta({
	layout: false,
	middleware: 'guest',
});

const supabase = useSupabaseClient();
const { setActiveTenant } = useTenant();
const loading = ref(false);
const userCredentials = ref({
	username: '',
	password: '',
});
const errorMessage = ref('');
const pendingProfile = ref<CurrentAppUser | null>(null);
const selectedTenantSlug = ref('');
const user = useSupabaseUser();

const tenantOptions = computed(() => pendingProfile.value?.memberships.map(item => ({
	label: item.tenant.name,
	value: item.tenant.slug,
})) ?? []);

const requiresTenantSelection = computed(() => (
	(pendingProfile.value?.memberships.length ?? 0) > 1
	&& !pendingProfile.value?.activeTenant
));

const translateErrorMessage = (code: AuthError['code']) => {
	switch (code) {
		case 'invalid_credentials':
			return 'Kullanıcı adı veya şifre yanlış';
		default:
			return 'Hata oluştu, lütfen tekrar deneyin';
	}
};

const redirectToTenant = (role: CurrentAppUser['role'], tenant: TenantSummary) => {
	setActiveTenant(tenant);
	if (role === 'admin') {
		return navigateTo(`/${tenant.slug}`);
	}

	return navigateTo(`/${tenant.slug}/mobile`);
};

const fetchProfile = () => $fetch<CurrentAppUser>('/api/users/me').catch(() => null);

const finalizeLogin = async (profile: CurrentAppUser | null) => {
	if (!profile) {
		errorMessage.value = 'Kullanıcı profili alınamadı';
		return;
	}

	if (profile.activeTenant) {
		pendingProfile.value = null;
		selectedTenantSlug.value = profile.activeTenant.slug;
		await redirectToTenant(profile.role, profile.activeTenant);
		return;
	}

	if (profile.memberships.length === 1) {
		pendingProfile.value = null;
		selectedTenantSlug.value = profile.memberships[0].tenant.slug;
		await redirectToTenant(profile.role, profile.memberships[0].tenant);
		return;
	}

	if (profile.memberships.length > 1) {
		pendingProfile.value = profile;
		selectedTenantSlug.value = '';
		errorMessage.value = '';
		return;
	}

	errorMessage.value = 'Kullanıcının aktif tenant erişimi bulunamadı';
};

const continueWithSelectedTenant = async () => {
	const profile = pendingProfile.value;
	if (!profile) {
		return;
	}

	const tenant = profile.memberships.find(item => item.tenant.slug === selectedTenantSlug.value)?.tenant;
	if (!tenant) {
		errorMessage.value = 'Lütfen bir tenant seçin';
		return;
	}

	errorMessage.value = '';
	loading.value = true;
	try {
		await redirectToTenant(profile.role, tenant);
	}
	finally {
		loading.value = false;
	}
};

const login = async () => {
	if (requiresTenantSelection.value) {
		await continueWithSelectedTenant();
		return;
	}

	const username = userCredentials.value.username.trim().toLowerCase();
	const password = userCredentials.value.password.trim();
	if (!username || !password) {
		return;
	}

	loading.value = true;
	errorMessage.value = '';
	const resolvedUser = await $fetch<{ email: string }>('/api/auth/resolve-username', {
		query: { username },
	}).catch(() => null);

	const email = resolvedUser?.email || (username.includes('@') ? username : '');

	if (!email) {
		errorMessage.value = 'Kullanıcı adı veya şifre yanlış';
		loading.value = false;
		return;
	}

	const { error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) {
		errorMessage.value = translateErrorMessage(error.code);
		console.error('Giriş başarısız:', error.message);
	}
	else {
		await finalizeLogin(await fetchProfile());
	}
	loading.value = false;
};

onMounted(async () => {
	if (!user.value) {
		return;
	}

	loading.value = true;
	await finalizeLogin(await fetchProfile());
	loading.value = false;
});
</script>

<template>
	<div class="flex justify-center items-center min-h-screen bg-gray-100 px-4">
		<Card class="w-full max-w-md shadow-lg">
			<template #title>
				Giriş Yap
			</template>
			<template #content>
				<form @submit.prevent="login">
					<div class="space-y-4">
						<div
							v-if="!requiresTenantSelection"
							class="w-full"
						>
							<label
								for="username"
								class="block mb-1"
							>Kullanıcı adı</label>
							<InputText
								id="username"
								v-model="userCredentials.username"
								type="text"
								placeholder="Kullanıcı adı"
								class="w-full"
								:disabled="loading"
								autocomplete="username"
							/>
						</div>

						<div
							v-if="!requiresTenantSelection"
							class="w-full"
						>
							<label
								for="password"
								class="block mb-1"
							>Şifre</label>
							<Password
								id="password"
								v-model="userCredentials.password"
								toggle-mask
								:feedback="false"
								placeholder="Şifre"
								input-class="w-full"
								class="w-full"
								:disabled="loading"
							/>
						</div>

						<div
							v-if="requiresTenantSelection"
							class="w-full"
						>
							<label
								for="tenant"
								class="block mb-1"
							>Tenant</label>
							<Select
								id="tenant"
								v-model="selectedTenantSlug"
								:options="tenantOptions"
								option-label="label"
								option-value="value"
								placeholder="Tenant seçin"
								class="w-full"
								:disabled="loading"
							/>
						</div>

						<Button
							:label="requiresTenantSelection ? 'Tenant ile devam et' : 'Giriş Yap'"
							class="w-full"
							:loading="loading"
							type="submit"
							:disabled="loading || (!requiresTenantSelection && (!userCredentials.username || !userCredentials.password)) || (requiresTenantSelection && !selectedTenantSlug)"
						/>

						<Message
							v-if="errorMessage"
							severity="error"
							:closable="false"
						>
							{{ errorMessage }}
						</Message>
					</div>
				</form>
			</template>
		</Card>
	</div>
</template>
