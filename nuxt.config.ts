import tailwindcss from '@tailwindcss/vite';
import Aura from '@primeuix/themes/aura';
import { PrimeVueLocaleOptions } from 'primevue';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxtjs/supabase',
		'@nuxtjs/google-fonts',
		'@samk-dev/nuxt-vcalendar',
		'@primevue/nuxt-module',
		'@nuxt/eslint',
	],
	ssr: false,
	devtools: { enabled: true },
	app: {
		head: {
			link: [
				{
					rel: 'stylesheet',
					href: 'https://cdn.jsdelivr.net/npm/remixicon@2.5.0/fonts/remixicon.css',
				},
			],
		},
	},
	css: ['./public/assets/main.css'],
	runtimeConfig: {
		public: {
			supabaseUrl: process.env.SUPABASE_URL,
			supabaseKey: process.env.SUPABASE_KEY,
		},
	},
	compatibilityDate: '2024-11-01',
	vite: {
		plugins: [tailwindcss()],
	},
	eslint: {
		config: {
			stylistic: {
				indent: 'tab',
				semi: true,
				// ...
			},
		},
	},
	googleFonts: {
		families: {
			Inter: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
		},
	},
	primevue: {
		options: {
			ripple: true,
			inputVariant: 'filled',
			theme: {
				preset: Aura,
				options: {
					prefix: 'p',
					darkModeSelector: '.my-app-dark',
					cssLayer: false,
				},
			},
		},
	},
	supabase: {
		url: process.env.SUPABASE_URL,
		key: process.env.SUPABASE_KEY,
		redirect: false,
		// redirectOptions: {
		//   login: '/',
		//   callback: '/confirm',
		// },
	},
});
