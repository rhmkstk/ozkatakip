<script setup lang="ts">
defineProps<{
  isActive: boolean;
}>();

const emit = defineEmits<{
  (e: "update:isActive", value: boolean): void;
  (e: "openChangeDialog"): void;
}>();

function closeDialog() {
  emit("update:isActive", false);
}

function handleChangeClick() {
  closeDialog();
  emit("openChangeDialog");
}
</script>

<template>
  <Dialog
    :visible="isActive"
    :show-header="false"
    modal
    @update:visible="closeDialog"
    class="mx-4"
  >
    <div class="flex flex-col items-center pt-4">
      <div class="flex space-x-1">
        <h3 class="text-lg font-semibold">Bakım kaydı oluşturuldu</h3>
        <i class="ri-check-line text-green-600 text-4xl leading-5" />
      </div>

      <Message severity="warn" class="my-6">
				<div class="flex gap-2">
        <i class="ri-error-warning-line text-2xl leading-6" />
        <p
          >YSC kullanima uygun olmadigi icin degisim gerektirmektedir. Lütfen
          degisim kaydi olusturunuz!</p>
				</div>
      </Message>
    </div>

    <template #footer>
      <Button
        label="Degisim kaydi olustur"
        severity="warn"
        size="large"
        class="w-full"
        @click="handleChangeClick"
      />
    </template>
  </Dialog>
</template>
