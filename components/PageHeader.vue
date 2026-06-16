<script lang="ts" setup>
import UserBadge from "./UserBadge.vue";

type Props = {
  title?: string;
};
const props = defineProps<Props>();
</script>

<template>
  <div class="flex flex-col">
    <div class="flex justify-between border-b app-border-subtle p-4">
      <h2 v-if="props.title" class="text-2xl font-semibold">
        {{ props.title }}
      </h2>
      <div class="ml-auto shrink-0">
        <UserBadge />
      </div>
    </div>
		<div class="flex w-full p-4">
			<slot/>
		</div>
  </div>
</template>
