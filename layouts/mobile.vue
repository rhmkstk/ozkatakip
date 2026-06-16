<script setup lang="ts">
const { toTenantPath } = useTenant();
</script>
<template>
  <div class="h-svh">
    <div class="h-full p-4">
      <header class="flex items-center space-x-2 mb-6">
        <Button
          icon="ri-arrow-left-line"
          label="Geri"
          aria-label="go back"
          size="small"
          outlined
          severity="primary"
          @click="$router.push(toTenantPath('/mobile'))"
        />
      </header>

      <slot />
    </div>
  </div>
</template>
