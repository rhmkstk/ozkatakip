<script setup lang="ts">
definePageMeta({
  layout: "mobile",
});

const locationId = ref<string | null>("");
const showScanner = ref(false);
const { toTenantPath } = useTenant();
</script>

<template>
  <!-- <MobileIndexPage /> -->
  <div class="h-full flex flex-col pb-6">
    <div class="app-bg-subtle rounded-md">
      <div class="flex items-center space-x-2 px-4 py-4">
        <div
          class="size-10 text-2xl font-semibold flex items-center justify-center rounded-full app-bg-primary"
        >
          R
        </div>
        <div class="flex flex-col">
          <p class="leading-5 font-semibold">Rahmi Kostik</p>
          <span class="text-xs app-text-muted">Tekniker</span>
        </div>
      </div>
    </div>
    <div class="mt-auto px-4">
      <h3 class="font-semibold text-lg">YSC Bul</h3>
      <p class="mt-2 app-text-muted text-sm">
        Telefonundan YSC üzerindeki QR kodu tarayarak veya YSC no ile
        işlem yapmak istediğiniz YSC'yi bulun.
      </p>
      <div class="pt-8">
        <InputGroup>
          <InputText
            id="building_area"
            v-model="locationId"
            placeholder="ATM-2"
          />
          <Button
            label="YSC Ara"
            severity="secondary"
            @click="
              $router.push(toTenantPath(`/mobile/transactions/${locationId}`))
            "
          />
        </InputGroup>
        <Divider />
        <Button
          fluid
          icon="ri-camera-fill"
          size="large"
          label="QR Kod Tara"
          @click="showScanner = true"
        />
      </div>
    </div>

    <QRScanner
      v-if="showScanner"
      @close="showScanner = false"
      @scan-complete="
        (locationId) =>
          $router.push(toTenantPath(`/mobile/transactions/${locationId}`))
      "
    />
  </div>
</template>
