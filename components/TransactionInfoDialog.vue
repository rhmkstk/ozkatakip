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
    header="Bakım Kaydı"
    modal
    @update:visible="closeDialog"
    class="w-full max-w-md mx-4"
    :dismissable-mask="true"
  >
    <div class="flex items-start gap-3">
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full app-status-success-soft"
      >
        <i class="ri-check-line text-xl" />
      </div>

      <div class="min-w-0">
        <h3 class="text-lg font-semibold tracking-tight app-text">
          Bakım kaydı oluşturuldu
        </h3>
        <p class="mt-1 text-sm app-text-muted">
          PR-10 No'lu YSC için bakım kaydı oluşturuldu. Ancak ürün şu anda
          kullanıma uygun değil.
        </p>
      </div>
    </div>

    <!-- Warning box -->
    <Message
      severity="warn"
      class="mt-6"
      :closable="false"
      :pt="{ content: { class: '!items-start' } }"
    >
      <template #icon>
        <i class="ri-error-warning-line text-2xl" />
      </template>
      <span>Mevcut YSC'yi kullanıma uygun başka bir YSC ile değiştirin.</span>
    </Message>

    <template #footer>
      <div class="flex gap-2 mt-4">
        <Button
          label="Vazgeç"
          severity="secondary"
          class="sm:w-auto"
          size="small"
          @click="closeDialog"
        />
        <Button
          label="Değişim kaydı oluştur"
          class="sm:w-auto"
          icon="ri-refresh-line"
          size="small"
          @click="handleChangeClick"
        />
      </div>
    </template>
  </Dialog>
</template>
