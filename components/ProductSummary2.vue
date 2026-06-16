<script setup lang="ts">
import { productStatusTypeLabels } from "~/constants";
import type {
  MobileTransactionLocation,
  MobileTransactionProduct,
} from "~/types/mobile-transaction";

const props = defineProps<{
  product: MobileTransactionProduct;
  location: MobileTransactionLocation;
}>();

const productStatusLabel = computed(() => {
  const currentStatus = props.product.current_status;
  return currentStatus ? productStatusTypeLabels[currentStatus] : "BILGI YOK";
});

function toTitleCase(value?: string | null) {
  if (!value) {
    return "Belirtilmemiş";
  }

  return value
    .toLocaleLowerCase("tr-TR")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}
</script>

<template>
  <div class="mb-4">
    <div class="px-4 py-3 flex items-center bg-red-50 rounded-t-md">
      <span
        class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-700"
      >
        <i class="ri-close-line"></i>
        {{ productStatusLabel }}
      </span>
    </div>
    <div class="p-4 border-x border-b app-border rounded-b-md">
      <div>
        <p class="text-sm app-text leading-3">
          {{ product.unit ? product.unit : "Birim belirtilmemiş" }}
        </p>
        <h3 class="truncate text-lg font-semibold text-color">
          {{ product.model_type || "Model bilgisi yok" }}
        </h3>

        <div class="mt-2 flex items-center gap-1.5 text-color">
          <i class="ri-map-pin-line shrink-0 text-base inline-flex" />
          <p class="min-w-0 truncate text-sm">
            {{ toTitleCase(location.building_id?.name) }}
            /
            {{ toTitleCase(location.room) }}
          </p>
        </div>
      </div>

      <div class="my-6 h-px bg-gray-100" />

      <div class="grid grid-cols-2 gap-x-8 gap-y-4">
        <div class="flex flex-col">
          <p class="text-xs app-text">SKT</p>
          <p class="font-semibold text-color text-sm">
            {{ formatTurkishDate(product.next_refill_date) }}
          </p>
        </div>

        <div class="flex flex-col">
          <p class="text-xs app-text">Son Dolum</p>
          <p class="font-semibold text-color text-sm">
            {{ formatTurkishDate(product.refill_date) }}
          </p>
        </div>

        <div class="flex flex-col">
          <p class="text-xs app-text">Test</p>
          <p class="font-semibold text-color text-sm">
            {{
              product.hydrostatic_test_date
                ? formatTurkishDate(product.hydrostatic_test_date)
                : "Belirtilmemiş"
            }}
          </p>
        </div>

        <div class="flex flex-col">
          <p class="text-xs app-text">Seri No</p>
          <p class="font-semibold text-color text-sm">
            {{ product.serial_number || "Belirtilmemiş" }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
