<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';

type Props = {
	title: string;
	visible: boolean;
};

const props = defineProps<Props>();
const router = useRouter();

const isVisible = ref(false);
const countDown = ref(5);
let timer: ReturnType<typeof setInterval> | null = null;

watch(() => props.visible, (newVal) => {
	isVisible.value = newVal;
}, {
	immediate: true,
});

// Watch for visibility changes to start countdown
watch(isVisible, (newVal) => {
	if (newVal) {
		countDown.value = 5;
		startCountdown();
	}
	else {
		clearCountdown();
	}
}, {
	immediate: true,
});

// Starts the countdown
function startCountdown() {
	clearCountdown(); // Ensure no multiple timers
	timer = setInterval(() => {
		if (countDown.value > 1) {
			countDown.value--;
		}
		else {
			clearCountdown();
			isVisible.value = false;
			router.push('/mobile');
		}
	}, 1000);
}

// Clear the timer
function clearCountdown() {
	if (timer) {
		clearInterval(timer);
		timer = null;
	}
}

onMounted(() => {
	isVisible.value = props.visible;
});
onUnmounted(() => {
	clearCountdown();
});
</script>

<template>
	<Dialog
		v-model:visible="isVisible"
		:show-header="false"
		:modal="true"
	>
		<div class="flex flex-col items-center pt-4">
			<i class="ri-checkbox-circle-line text-6xl text-green-600 mb-2" />
			<h3 class="text-lg font-semibold mb-2">
				{{ title }}
			</h3>
			<p class="text-sm text-gray-600 mb-6">
				<span class="font-semibold">{{ countDown }}</span> saniye içerisinde anasayfaya yönlendirileceksiniz.
			</p>
		</div>
		<template #footer>
			<Button
				label="Anasayfaya dön"
				severity="primary"
				size="large"
				class="mx-auto"
				@click="isVisible = false; router.push('/mobile')"
			/>
		</template>
	</Dialog>
</template>
