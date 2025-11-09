<script setup lang="ts">
type Props = {
	src: string | null;
};
defineProps<Props>();

const showModal = ref(false);

const handleKeyDown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		showModal.value = false;
	}
};

onMounted(() => {
	window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeyDown);
});
</script>

<template>
	<div>
		<!-- Thumbnail with hover zoom -->
		<button v-if="src" @click="showModal = true">
			<img
				:src="`/api/storage/inspection-photos/${encodeURIComponent(src)}`"
				alt="Zoomable"
				class="transition-transform duration-300 ease-in-out transform hover:scale-110 cursor-pointer size-20 object-cover rounded-md"
			>
		</button>

		<!-- Modal -->
		<transition name="modal-fade">
			<div
				v-if="showModal"
				class="fixed inset-0 z-50 flex items-center justify-center"
			>
				<!-- Background overlay -->
				<div
					class="absolute inset-0 bg-gray-200 opacity-70"
					@click="showModal = false"
				/>

				<!-- Image container (stays on top, won't close on click) -->
				<div
					class="relative z-10 w-[60vw] max-h-[90vh] overflow-hidden flex justify-center items-center"
					@click.stop
				>
					<button
						class="absolute top-0 right-0 cursor-pointer"
						@click="showModal = false"
					>
						<i class="ri-close-line text-xl" />
					</button>
					<!-- Full-height Image -->
					<img
						v-if="src"
						:src="`/api/storage/inspection-photos/${encodeURIComponent(src)}`"
						alt="Full view"
						class="object-contain h-screen w-full"
					>
				</div>
			</div>
		</transition>
	</div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.modal-fade-enter-to,
.modal-fade-leave-from {
  opacity: 1;
  transform: scale(1);
}
</style>
