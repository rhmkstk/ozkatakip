<script setup lang="ts">
import type { AuthError } from '@supabase/supabase-js';

definePageMeta({
	layout: false,
	middleware: 'guest',
});

const supabase = useSupabaseClient();
const loading = ref(false);
const userCredentials = ref({
	email: '',
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
	const email = userCredentials.value.email.trim();
	const password = userCredentials.value.password.trim();

	loading.value = true;
	errorMessage.value = '';
	const { data, error } = await supabase.auth.signInWithPassword({ email, password });
	if (error) {
		errorMessage.value = translateErrorMessage(error.code);
		console.error('Giriş başarısız:', error.message);
	}
	else {
		const userRole = getUserDetail(data.user.id)?.role || 'unknown';
		if(userRole === 'admin') {
			navigateTo('/');	
		}else {
			navigateTo('/mobile');
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
								for="email"
								class="block mb-1"
							>E-posta</label>
							<InputText
								id="email"
								v-model="userCredentials.email"
								type="email"
								placeholder="Email"
								class="w-full"
								:disabled="loading"
								autocomplete="email"
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
							:disabled="loading || !userCredentials.email || !userCredentials.password"
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
