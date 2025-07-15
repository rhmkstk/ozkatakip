<script setup lang="ts">
type Props = {
  title?: string;
  subtitle?: string;
};
defineProps<Props>();
</script>
<template>
  <Card
    style="width: max-content"
    class="flex flex-col items-center justify-center mx-auto mt-20"
  >
    <template #header>
      <i class="ri-close-circle-line text-8xl"></i>
    </template>
    <template #title>
      <div class="text-center text-2xl font-semibold">
        <span v-if="title">{{ title }}</span>
        <slot v-else name="title"></slot>
      </div>
    </template>
    <template #subtitle>
      <div class="text-center text-gray-500 mt-2">
        <span v-if="subtitle">{{ subtitle }}</span>
        <slot v-else name="subtitle"></slot>
      </div>
    </template>
    <template #footer>
      <slot name="footer"></slot>
    </template>
  </Card>
</template>
