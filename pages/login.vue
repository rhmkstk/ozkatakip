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
	<div class="grid min-h-dvh bg-white lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.72fr)]">
		<section class="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
			<div class="absolute -right-24 -top-24 size-96 rounded-full border border-white/10" />
			<div class="absolute -right-8 top-20 size-64 rounded-full border border-white/10" />
			<div class="relative flex items-center gap-3">
				<div class="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-2xl">
					<i class="ri-shield-check-line" />
				</div>
				<div>
					<p class="text-lg font-bold">
						Özka Takip
					</p><p class="text-xs uppercase tracking-[0.15em] text-slate-400">
						Periyodik kontrol
					</p>
				</div>
			</div>
			<div class="relative my-auto max-w-xl">
				<p class="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
					Sade. Güvenilir. İzlenebilir.
				</p>
				<h1 class="mt-5 text-4xl font-semibold leading-tight tracking-[-0.035em]">
					Saha kontrolleri ve ekipman kayıtları tek yerde.
				</h1>
				<p class="mt-5 max-w-lg text-base leading-7 text-slate-400">
					Bakım, dolum ve periyodik kontrol süreçlerini hızlıca kaydedin; geçmişi ve yaklaşan işlemleri kolayca takip edin.
				</p>
			</div>
			<p class="relative text-xs text-slate-500">
				Yetkili kullanıcı erişimi
			</p>
		</section>

		<main class="flex items-center justify-center bg-slate-50 px-5 py-10 sm:px-10">
			<div class="w-full max-w-sm">
				<div class="mb-9 flex items-center gap-3 lg:hidden">
					<div class="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
						<i class="ri-shield-check-line" />
					</div>
					<div>
						<p class="font-bold text-slate-950">
							Özka Takip
						</p><p class="text-[10px] uppercase tracking-wider text-slate-500">
							Periyodik kontrol
						</p>
					</div>
				</div>

				<p class="app-kicker">
					Hesabınıza erişin
				</p>
				<h2 class="mt-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
					{{ requiresTenantSelection ? 'Çalışma alanını seçin' : 'Tekrar hoş geldiniz' }}
				</h2>
				<p class="mt-2 text-sm leading-6 text-slate-500">
					{{ requiresTenantSelection ? 'Devam etmek istediğiniz çalışma alanını belirleyin.' : 'Devam etmek için kullanıcı bilgilerinizi girin.' }}
				</p>

				<form
					class="mt-8"
					@submit.prevent="login"
				>
					<div class="space-y-5">
						<div
							v-if="!requiresTenantSelection"
							class="w-full"
						>
							<label
								for="username"
								class="mb-2 block text-sm font-semibold text-slate-700"
							>Kullanıcı adı</label>
							<InputText
								id="username"
								v-model="userCredentials.username"
								type="text"
								placeholder="Kullanıcı adınızı girin"
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
								class="mb-2 block text-sm font-semibold text-slate-700"
							>Şifre</label>
							<Password
								id="password"
								v-model="userCredentials.password"
								toggle-mask
								:feedback="false"
								placeholder="Şifrenizi girin"
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
								class="mb-2 block text-sm font-semibold text-slate-700"
							>Çalışma alanı</label>
							<Select
								id="tenant"
								v-model="selectedTenantSlug"
								:options="tenantOptions"
								option-label="label"
								option-value="value"
								placeholder="Çalışma alanı seçin"
								class="w-full"
								:disabled="loading"
							/>
						</div>

						<Button
							:label="requiresTenantSelection ? 'Devam et' : 'Giriş yap'"
							class="mt-2 w-full"
							size="large"
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
				<p class="mt-8 text-center text-xs text-slate-400">
					Erişim sorunu yaşıyorsanız sistem yöneticinizle iletişime geçin.
				</p>
			</div>
		</main>
	</div>
</template>
