<script setup lang="ts">
import type { AuthError } from '@supabase/supabase-js';

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

const translateErrorMessage = (code: AuthError['code']) => {
	switch (code) {
		case 'invalid_credentials':
			return 'Kullanıcı adı veya şifre yanlış';
		default:
			return 'Hata oluştu, lütfen tekrar deneyin';
	}
};

const login = async () => {
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
		const profile = await $fetch<{
			role: 'admin' | 'employee';
			activeTenant: { slug: string; name: string } | null;
		}>('/api/users/me').catch(() => null);
		const userRole = profile?.role || 'employee';
		if (profile?.activeTenant) {
			setActiveTenant(profile.activeTenant);
		}
		const tenantSlug = profile?.activeTenant?.slug;
		if (!tenantSlug) {
			errorMessage.value = 'Kullanıcının aktif tenant erişimi bulunamadı';
			loading.value = false;
			return;
		}
		if (userRole === 'admin') {
			navigateTo(`/${tenantSlug}`);
		}
		else {
			navigateTo(`/${tenantSlug}/mobile`);
		}
	}
	loading.value = false;
};
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
						<div class="w-full">
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

						<div class="w-full">
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

						<Button
							label="Giriş Yap"
							class="w-full"
							:loading="loading"
							type="submit"
							:disabled="loading || !userCredentials.username || !userCredentials.password"
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
