import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import Aura from '@primeuix/themes/aura';
import { tr as primeLocaleTr } from 'primelocale/js/tr.js';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxtjs/supabase',
		'@samk-dev/nuxt-vcalendar',
		'@primevue/nuxt-module',
		'@nuxt/eslint',
		'@vite-pwa/nuxt',
	],
	ssr: false,
	devtools: { enabled: true },
	app: {
		pageTransition: {
			name: 'page',
			mode: 'out-in',
		},
		head: {
			htmlAttrs: {
				lang: 'tr',
			},
			meta: [
				{
					name: 'viewport',
					content: 'width=device-width, initial-scale=1, viewport-fit=cover',
				},
				{
					name: 'theme-color',
					content: '#225AEB',
				},
				{
					name: 'mobile-web-app-capable',
					content: 'yes',
				},
				{
					name: 'apple-mobile-web-app-capable',
					content: 'yes',
				},
				{
					name: 'apple-mobile-web-app-status-bar-style',
					content: 'default',
				},
				{
					name: 'apple-mobile-web-app-title',
					content: 'ozkatakip',
				},
			],
			link: [
				{
					rel: 'icon',
					type: 'image/png',
					href: '/pwa/icon-64x64.png',
				},
				{
					rel: 'apple-touch-icon',
					sizes: '120x120',
					href: '/pwa/apple-touch-icon-120x120.png',
				},
				{
					rel: 'apple-touch-icon',
					sizes: '152x152',
					href: '/pwa/apple-touch-icon-152x152.png',
				},
				{
					rel: 'apple-touch-icon',
					sizes: '167x167',
					href: '/pwa/apple-touch-icon-167x167.png',
				},
				{
					rel: 'apple-touch-icon',
					sizes: '180x180',
					href: '/pwa/apple-touch-icon-180x180.png',
				},
				{
					rel: 'preconnect',
					href: 'https://fonts.googleapis.com',
				},
				{
					rel: 'preconnect',
					href: 'https://fonts.gstatic.com',
					crossorigin: '',
				},
				{
					rel: 'stylesheet',
					href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
				},
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
	hooks: {
		async 'nitro:build:public-assets'(nitro) {
			const rootDir = nitro.options.rootDir;

			await cp(resolve(rootDir, 'public'), nitro.options.output.publicDir, {
				force: true,
				recursive: true,
			});

			await cp(
				resolve(rootDir, '.nuxt/dist/client'),
				nitro.options.output.publicDir,
				{
					force: true,
					recursive: true,
				},
			);
		},
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
			locale: primeLocaleTr,
		},
	},
	pwa: {
		registerType: 'autoUpdate',
		includeAssets: [
			'app-icon.png',
			'pwa/icon-64x64.png',
			'pwa/apple-touch-icon-120x120.png',
			'pwa/apple-touch-icon-152x152.png',
			'pwa/apple-touch-icon-167x167.png',
			'pwa/apple-touch-icon-180x180.png',
		],
		manifest: {
			id: '/login?source=pwa',
			name: 'ozkatakip',
			short_name: 'ozkatakip',
			description: 'ozkatakip mobil saha uygulamasi',
			theme_color: '#225AEB',
			background_color: '#B62472',
			display: 'standalone',
			scope: '/',
			start_url: '/login?source=pwa',
			lang: 'tr',
			orientation: 'portrait',
			icons: [
				{
					src: '/pwa/icon-192x192.png',
					sizes: '192x192',
					type: 'image/png',
				},
				{
					src: '/pwa/icon-192x192-maskable.png',
					sizes: '192x192',
					type: 'image/png',
					purpose: 'maskable',
				},
				{
					src: '/pwa/icon-512x512.png',
					sizes: '512x512',
					type: 'image/png',
				},
				{
					src: '/pwa/icon-512x512-maskable.png',
					sizes: '512x512',
					type: 'image/png',
					purpose: 'maskable',
				},
			],
		},
		workbox: {
			globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff2}'],
		},
		client: {
			installPrompt: true,
		},
		devOptions: {
			enabled: false,
			suppressWarnings: true,
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
