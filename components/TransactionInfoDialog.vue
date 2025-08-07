<script setup lang="ts">
const props = defineProps<{
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:isActive', value: boolean): void;
  (e: 'openChangeDialog'): void;
}>();

function closeDialog() {
  emit('update:isActive', false);
}

function handleChangeClick() {
  closeDialog();
  emit('openChangeDialog');
}
</script>

<template>
  <Dialog
    :visible="isActive"
    @update:visible="closeDialog"
    :show-header="false"
    modal
  >
    <div class="flex flex-col items-center pt-4">
      <div class="flex items-center space-x-1">
        <h3 class="text-lg font-semibold">
          Bakım kaydı oluşturlamadı. 
        </h3>
        <i class="ri-close-line text-red-600 text-4xl" />
      </div>

      <Message severity="warn" class="my-6">
        YSC kullanima uygun olmadigi icin degisim gerektirmektedir. Lütfen
        degisim kaydi olusturunuz!
      </Message>
    </div>

    <template #footer>
      <Button
        label="Degisim kaydi olustur"
        severity="primary"
        size="large"
        class="mx-auto"
        @click="handleChangeClick"
      />
    </template>
  </Dialog>
</template>
