<template>
  <div>
    <!-- Thumbnail with hover zoom -->
    <img
      :src="src"
      alt="Zoomable"
      class="transition-transform duration-300 ease-in-out transform hover:scale-110 cursor-pointer"
      @click="showModal = true"
    />

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
      ></div>

      <!-- Image container (stays on top, won't close on click) -->
      <div
        class="relative z-10 w-[60vw] max-h-[90vh] overflow-hidden flex justify-center items-center"
        @click.stop
      >

        <!-- Full-height Image -->
        <img
          :src="src"
          alt="Full view"
          class="object-contain h-screen w-full"
        />
      </div>
    </div>
    </transition>
  </div>
</template>

<script setup>
const props = defineProps({
  src: { type: String, required: true },
});

const showModal = ref(false);

const handleKeyDown = (event) => {
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
}</style>
