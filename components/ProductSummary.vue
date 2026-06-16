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
  <div class="app-bg-subtle p-2 rounded-lg mb-4">
    <div
      class="px-1 pb-2 mb-4 flex items-start justify-between border-b app-divider"
    >
      <div class="flex-1">
        <h3 class="text-lg font-semibold truncate">
          {{ product.unit ? `${product.unit}` : "Birim belirtilmemiş" }}
          ·
          {{ product.model_type || "Model bilgisi yok" }}
        </h3>
        <div class="flex items-center space-x-1 mt-1 app-text-muted">
          <i class="ri-map-pin-line" />
          <p>
            {{ toTitleCase(location.building_id?.name) }}
            /
            {{ toTitleCase(location.room) }}
          </p>
        </div>
        <!-- <h4 class="text-sm app-text-muted">
          {{ product.unit ? `${product.unit}` : "Birim belirtilmemiş" }}
        </h4> -->
      </div>
      <Message
        severity="danger"
        icon="ri-error-warning-line"
        size="small"
        variant="outlined"
      >
        {{ productStatusLabel }}
      </Message>
      <!-- <div class="flex items-center space-x-1 shrink-0">
        <span class="size-1.5 rounded-full" :class="statusBgColor" />
        <span class="text-xs app-text-muted uppercase">
          {{ productStatusLabel }}
        </span>
      </div> -->
    </div>

    <div class="flex items-stretch gap-4 min-h-[200px]">
      <div class="w-[25%] max-w-[140px] rounded overflow-hidden">
        <img
          src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
          alt="fire-estinguisher"
          class="object-cover w-full h-full opacity-80"
        />
      </div>
      <div class="flex-1 flex flex-col gap-4">
        <!-- <div class="flex space-x-1">
          <i class="ri-map-pin-line" />
          <div class="flex flex-col">
            <p class="font-semibold">Konum</p>
            <p>
              {{ location.building_id?.name || "Belirtilmemiş" }} /
              {{ location.room || "Belirtilmemiş" }}
            </p>
          </div>
        </div> -->
        <div class="flex space-x-1">
          <i class="ri-calendar-line" />
          <div class="flex flex-col flex-1">
            <p class="font-semibold">Tarihler</p>
            <div class="flex flex-col mt-2 gap-1">
              <div class="flex flex-1 text-sm">
                <p class="">SKT</p>
                <p class="flex-1 text-end font-semibold">
                  {{ formatTurkishDate(product.next_refill_date) }}
                </p>
              </div>
              <div class="flex flex-1 text-sm">
                <p class="">Dolum</p>
                <p class="flex-1 text-end font-semibold">
                  {{ formatTurkishDate(product.refill_date) }}
                </p>
              </div>
              <div class="flex flex-1 text-sm">
                <p class="">Test</p>
                <p class="flex-1 text-end font-semibold">
                  {{
                    product.hydrostatic_test_date
                      ? formatTurkishDate(product.hydrostatic_test_date)
                      : "Belirtilmemiş"
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex space-x-1 gap-1">
          <i class="ri-profile-line" />
          <div class="flex flex-col flex-1">
            <p class="font-semibold">Kimlik</p>
            <div class="flex flex-col gap-1 mt-2">
              <div class="flex flex-1 text-sm">
                <p class="">Dolum periyodu</p>
                <p class="flex-1 text-end font-semibold">
                  {{
                    product.refill_period
                      ? `${product.refill_period} yıl`
                      : "Belirtilmemiş"
                  }}
                </p>
              </div>
              <div class="flex flex-1 text-sm">
                <p class="">Seri no</p>
                <p class="flex-1 text-end font-semibold">
                  {{ product.serial_number ?? "Belirtilmemiş" }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
