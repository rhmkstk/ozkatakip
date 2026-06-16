<script setup lang="ts">
import imageCompression from "browser-image-compression";
import type { FileUploadSelectEvent } from "primevue";
import type {
  MobileInspectionPayload,
  MobileTransactionCurrentProductData,
} from "~/types/mobile-transaction";
import { imageCompressionOptions } from "~/constants";
import { useMobileTransactionActions } from "~/composables/use-mobile-transaction-actions";
import { useMobileTransactionContext } from "~/composables/use-mobile-transaction-context";
import { useMobileOfflineState } from "~/composables/use-mobile-offline-state";
import { getOfflineAwareMobileTransactionContext } from "~/utils/mobile-offline-sync";

type ChangePageSessionState = {
  activeStep: string;
  newProductId: string;
  newProductData: MobileTransactionCurrentProductData | null;
  selectedNewProductRefillPeriod: number | null;
  hadPhotoSelected: boolean;
};

type EditableNewProductData = {
  location: MobileTransactionCurrentProductData["location"] | null;
  product: MobileTransactionCurrentProductData["product"] | null;
};

const CHANGE_STEPS = ["1", "2", "3"] as const;

function normalizeStep(value: unknown) {
  if (typeof value !== "string") {
    return "1";
  }

  return CHANGE_STEPS.includes(value as (typeof CHANGE_STEPS)[number])
    ? value
    : "1";
}

const route = useRoute();
const router = useRouter();
const supabase = useSupabaseClient();
const toast = useToast();
const { activeTenantSlug, toTenantPath } = useTenant();
const { submitInspection, submitProductSwitch, submitProductUpdate } =
  useMobileTransactionActions();
const { pendingCount, syncNow, isOnline } = useMobileOfflineState();

const locationId = computed(() => String(route.params.id));
const transactionPagePath = computed(() =>
  toTenantPath(`/mobile/transactions/${locationId.value}`),
);
const sessionStorageKey = computed(
  () =>
    `mobile-transaction-change:${activeTenantSlug.value ?? "tenant"}:${locationId.value}`,
);

const compressedImage = ref<File | null>(null);
const photoPreviewUrl = ref<string | null>(null);
const activeStep = ref("1");
const loading = ref(false);
const submitting = ref(false);
const successVisible = ref(false);
const showScanner = ref(false);
const newProductId = ref("");
const showPhotoRestoreNotice = ref(false);
const selectedNewProductRefillPeriod = ref<number | null>(null);
const newProductData = reactive<EditableNewProductData>({
  location: null,
  product: null,
});
const refillPeriodOptions = [
  { label: "1 yil", value: 1 },
  { label: "2 yil", value: 2 },
  { label: "3 yil", value: 3 },
  { label: "4 yil", value: 4 },
];

const { data, status, contextSource, hasCachedFallback } =
  await useMobileTransactionContext(locationId.value);

const isLoading = computed(() => {
  return status.value === "pending" || status.value === "idle" || loading.value;
});

const offlineBannerText = computed(() => {
  if (contextSource.value === "cache") {
    return "Cevrimdisi modda kayitli son urun bilgileri gosteriliyor.";
  }

  if (contextSource.value === "empty") {
    return "Bu YSC daha once cihaza alinmamis. Urun bilgileri bos olabilir; kayitlariniz kuyruga alinacak.";
  }

  return "";
});

const currentProductData = computed(() => {
  if (!data.value?.product || !data.value?.location) {
    return null;
  }

  return {
    product: data.value.product,
    location: data.value.location,
  } satisfies MobileTransactionCurrentProductData;
});

const currentProductSummaryCardData = computed(() => {
  if (!currentProductData.value) {
    return [];
  }

  return [
    {
      key: "YSC no",
      value: currentProductData.value.location.location_id,
    },
    {
      key: "Dolum periyodu",
      value: formatRefillPeriod(currentProductData.value.product.refill_period),
    },
    {
      key: "Seri no",
      value: currentProductData.value.product.serial_number ?? "Belirtilmemis",
    },
  ];
});

const newProductSummaryCardData = computed(() => {
  if (!newProductData.product || !newProductData.location) {
    return [];
  }

  return [
    {
      key: "YSC no",
      value: newProductData.location.location_id,
    },
    {
      key: "Dolum periyodu",
      value: formatRefillPeriod(newProductData.product.refill_period),
    },
    {
      key: "Seri no",
      value: newProductData.product.serial_number ?? "Belirtilmemis",
    },
  ];
});

const isRefillPeriodDirty = computed(() => {
  if (!newProductData.product) {
    return false;
  }

  return (
    newProductData.product.refill_period !==
    selectedNewProductRefillPeriod.value
  );
});

function formatRefillPeriod(value: number | null | undefined) {
  if (!value) {
    return "Belirtilmemis";
  }

  return `${value} yil`;
}

function isCompactSummaryKey(key: string) {
  return key === "YSC no" || key === "Seri no";
}

function setNewProductData(value: MobileTransactionCurrentProductData | null) {
  newProductData.location = value?.location ?? null;
  newProductData.product = value?.product ?? null;
  selectedNewProductRefillPeriod.value = value?.product?.refill_period ?? null;
}

function buildSessionState(): ChangePageSessionState {
  return {
    activeStep: activeStep.value,
    newProductId: newProductId.value,
    newProductData:
      newProductData.location && newProductData.product
        ? {
            location: newProductData.location,
            product: newProductData.product,
          }
        : null,
    selectedNewProductRefillPeriod: selectedNewProductRefillPeriod.value,
    hadPhotoSelected: Boolean(photoPreviewUrl.value || compressedImage.value),
  };
}

function persistSessionState() {
  if (!import.meta.client) {
    return;
  }

  sessionStorage.setItem(
    sessionStorageKey.value,
    JSON.stringify(buildSessionState()),
  );
}

function clearSessionState() {
  if (!import.meta.client) {
    return;
  }

  sessionStorage.removeItem(sessionStorageKey.value);
}

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

function restoreSessionState() {
  if (!import.meta.client) {
    return;
  }

  const rawState = sessionStorage.getItem(sessionStorageKey.value);
  if (!rawState) {
    return;
  }

  try {
    const parsedState = JSON.parse(rawState) as Partial<ChangePageSessionState>;

    if (typeof parsedState.newProductId === "string") {
      newProductId.value = parsedState.newProductId;
    }

    if (parsedState.newProductData) {
      setNewProductData(parsedState.newProductData);
    }

    if (typeof parsedState.selectedNewProductRefillPeriod === "number") {
      selectedNewProductRefillPeriod.value =
        parsedState.selectedNewProductRefillPeriod;
    }

    if (!route.query.step && parsedState.activeStep) {
      activeStep.value = normalizeStep(parsedState.activeStep);
    }

    if (parsedState.hadPhotoSelected) {
      showPhotoRestoreNotice.value = true;
    }
  } catch (error) {
    console.warn("Unable to restore mobile transaction change session", error);
    clearSessionState();
  }
}

watch(
  () => route.query.step,
  (step) => {
    const normalizedStep = normalizeStep(step);
    if (activeStep.value !== normalizedStep) {
      activeStep.value = normalizedStep;
    }
  },
  { immediate: true },
);

watch(activeStep, async (step) => {
  if (normalizeStep(route.query.step) === step) {
    return;
  }

  await router.replace({
    query: {
      ...route.query,
      step,
    },
  });
});

watch(
  [
    activeStep,
    newProductId,
    selectedNewProductRefillPeriod,
    photoPreviewUrl,
    compressedImage,
    () => newProductData.location,
    () => newProductData.product,
  ],
  () => {
    persistSessionState();
  },
  { deep: true },
);

onMounted(() => {
  restoreSessionState();
});

async function onFileSelect(event: FileUploadSelectEvent) {
  const imageFile = event.files[0];
  const reader = new FileReader();
  reader.onload = (loadEvent) => {
    if (loadEvent.target?.result) {
      photoPreviewUrl.value = loadEvent.target.result as string;
      showPhotoRestoreNotice.value = false;
    }
  };
  reader.readAsDataURL(imageFile);

  try {
    const compressedFile = await imageCompression(
      imageFile,
      imageCompressionOptions,
    );
    compressedImage.value = compressedFile as File;
  } catch (error) {
    console.warn(error);
  }
}

async function getNewProductData(
  nextLocationId: string,
  callback?: () => void,
  showErrorAlert = true,
) {
  if (!nextLocationId) {
    return false;
  }

  if (nextLocationId === locationId.value) {
    toast.add({
      severity: "warn",
      summary: "Gecersiz secim",
      detail: "Yeni YSC mevcut YSC ile ayni olamaz.",
      life: 2000,
    });
    return false;
  }

  loading.value = true;
  try {
    if (!activeTenantSlug.value) {
      throw new Error("Tenant slug missing");
    }

    const result = await getOfflineAwareMobileTransactionContext(
      activeTenantSlug.value,
      nextLocationId,
    );
    const mobileTransaction = result.context;

    if (!mobileTransaction?.location || !mobileTransaction?.product) {
      throw new Error("Product not found");
    }

    newProductId.value = nextLocationId;
    setNewProductData({
      location: mobileTransaction.location,
      product: mobileTransaction.product,
    });
    callback?.();
    return true;
  } catch (error) {
    console.error("Error fetching product data:", error);
    if (showErrorAlert) {
      alert("YSC bulunamadi. Lutfen YSC noyu kontrol edin.");
    }
    return false;
  } finally {
    loading.value = false;
  }
}

async function updateNewProductRefillPeriod() {
  if (
    !newProductData.product?.id ||
    !newProductData.location?.location_id ||
    selectedNewProductRefillPeriod.value === null
  ) {
    toast.add({
      severity: "warn",
      summary: "Eksik bilgi",
      detail: "Lutfen yeni urun icin dolum periyodu secin.",
      life: 2000,
    });
    return;
  }

  loading.value = true;
  try {
    const response = await submitProductUpdate({
      locationId: newProductData.location.location_id,
      productId: newProductData.product.id,
      patch: {
        id: newProductData.product.id,
        refill_period: selectedNewProductRefillPeriod.value,
      },
    });

    const refreshSuccess = await getNewProductData(
      newProductData.location.location_id,
      undefined,
      false,
    );
    if (!refreshSuccess) {
      throw new Error("Refresh after refill update failed");
    }

    toast.add({
      severity: response.mode === "queued" ? "info" : "success",
      summary: "Basarili",
      detail:
        response.mode === "queued"
          ? "Dolum periyodu kuyruga alindi."
          : "Yeni urunun dolum periyodu guncellendi.",
      life: 2000,
    });
  } catch (error) {
    console.error("Error updating refill period:", error);
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Dolum periyodu guncellenirken bir hata olustu.",
      life: 2000,
    });
  } finally {
    loading.value = false;
  }
}

async function finalizeChange() {
  if (submitting.value) {
    return;
  }

  if (!currentProductData.value?.location.location_id) {
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Mevcut YSC bilgileri yuklenemedi.",
      life: 2000,
    });
    return;
  }

  if (!newProductData.location?.location_id) {
    toast.add({
      severity: "warn",
      summary: "Eksik bilgi",
      detail: "Lutfen once yeni YSC secin.",
      life: 2000,
    });
    activeStep.value = "1";
    return;
  }

  submitting.value = true;
  loading.value = true;

  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error("Missing user");
    }

    const details = `arizali YSC no: ${currentProductData.value.location.location_id}, yeni YSC no: ${newProductData.location.location_id}`;
    const switchResponse = await submitProductSwitch({
      currentLocationId: currentProductData.value.location.location_id,
      newLocationId: newProductData.location.location_id,
      details,
    });

    const inspectionPayload: Omit<
      MobileInspectionPayload,
      "fire_extinguisher_id" | "photo_url" | "user_id"
    > = {
      position: true,
      body: true,
      control_card: true,
      hose_and_nozzle: true,
      instruction_and_label: true,
      mass: true,
      pin_and_seal: true,
      pressure: true,
      working_mechanism: true,
      result: true,
      note: null,
      date: formatDateOnlyForApi(new Date()),
      is_expiry: true,
    };

    const inspectionResponse = await submitInspection({
      locationId: currentProductData.value.location.location_id,
      userId,
      inspection: inspectionPayload,
      photoFile: compressedImage.value,
      photoFileName: compressedImage.value?.name,
      photoFileType: compressedImage.value?.type,
    });

    if (
      switchResponse.mode === "queued" ||
      inspectionResponse.mode === "queued"
    ) {
      toast.add({
        severity: "info",
        summary: "Kuyruga alindi",
        detail: "Degisim islemi internet geldiginde tamamlanacak.",
        life: 2500,
      });
      await syncNow();
    }

    clearSessionState();
    successVisible.value = true;
  } catch (error) {
    console.error("Error finalizing product change:", error);
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Degisim islemi tamamlanirken bir hata olustu.",
      life: 2000,
    });
  } finally {
    loading.value = false;
    submitting.value = false;
  }
}
</script>

<template>
  <div>
    <BaseLoader v-if="isLoading" />
    <div v-if="!isLoading" class="flex h-full flex-col">
      <div
        v-if="status === 'error' && isOnline && contextSource === 'network'"
        class="flex flex-col gap-y-8 py-2"
      >
        <p class="text-lg">
          Aradiginiz YSC bulunamadi. Geri donup farkli mevcut bir YSC ile islem
          yapabilirsiniz.
        </p>
        <Button label="Geri" @click="navigateTo(transactionPagePath)" />
      </div>

      <template v-else>
        <Message v-if="pendingCount > 0" severity="info" class="mb-4">
          {{ pendingCount }} islem senkronizasyon icin bekliyor.
        </Message>
        <Message
          v-if="contextSource !== 'network'"
          severity="secondary"
          class="mb-4"
        >
          {{ offlineBannerText }}
        </Message>

        <!-- <ProductSummary2
					v-if="data?.product"
					:product="data.product"
					:location="data.location"
				/> -->

        <Message
          v-if="hasCachedFallback && showPhotoRestoreNotice"
          severity="warn"
          class="my-4"
        >
          Sayfa yenilendigi icin onceki fotograf secimi geri yuklenemedi. Son
          adimda fotografi yeniden yuklemeniz gerekir.
        </Message>
        <!-- <h1 class="text-2xl font-semibold mb-8">Değişim</h1> -->

        <Stepper v-model:value="activeStep" class="mobile-change-stepper">
          <StepList>
            <Step value="1"> Yeni YSC </Step>
            <Step value="2"> Degisim </Step>
            <Step value="3"> Onay </Step>
          </StepList>

          <StepPanels>
            <StepPanel value="1">
              <h4 class="mb-8 text-sm app-text-muted">
                Bu adimda YSC no girerek veya QR kod okutarak yeni YSC'yi seç.
              </h4>

              <InputGroup>
                <InputText
                  id="new-product-id"
                  v-model="newProductId"
                  size="small"
                  placeholder="ATM-2"
                />
                <Button
                  label="YSC Ara"
                  severity="secondary"
                  size="small"
                  :disabled="!newProductId"
                  @click="
                    getNewProductData(newProductId, () => {
                      activeStep = '2';
                    })
                  "
                />
              </InputGroup>
              <Divider />
              <Button
                fluid
                icon="ri-camera-fill"
                label="QR Kod Tara"
                @click="showScanner = true"
              />

              <QRScanner
                v-if="showScanner"
                @close="showScanner = false"
                @scan-complete="
                  (scannedNumber: string) => {
                    newProductId = scannedNumber;
                    showScanner = false;
                    getNewProductData(scannedNumber, () => {
                      activeStep = '2';
                    });
                  }
                "
              />
            </StepPanel>

            <StepPanel value="2">
              <h4 class="mb-8 text-sm app-text-muted">
                Bu adimda yeni ve eski YSC bilgilerini kontrol et, bilgiler
                dogruysa son adim icin devam et.
              </h4>

              <div
                class="rounded-2xl bg-gradient-to-b  from-[var(--p-surface-200)] to-white px-1 pb-1 shadow-sm"
              >
                <div
                  class="text-[var(--p-surface-700)] py-3 px-4"
                >
                  <!-- <i class="ri-close-line" /> -->
                  <h5 class="font-semibold">Mevcut</h5>
                </div>
                <div
                  v-if="currentProductData"
                  class="flex flex-col items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                >
                  <h3 class="font-semibold text-lg truncate">
                    {{
                      currentProductData.product.model_type ||
                      "Model bilgisi yok"
                    }}
                    ·
                    {{
                      currentProductData.product.unit
                        ? `${currentProductData.product.unit}`
                        : "Birim belirtilmemiş"
                    }}
                  </h3>
                  <div class="flex items-start space-x-1 text-color text-sm">
                    <i class="ri-map-pin-line" />
                    <p>
                      {{
                        toTitleCase(
                          currentProductData.location?.building_id?.name,
                        )
                      }}
                      /
                      {{ toTitleCase(currentProductData.location.room) }}
                    </p>
                  </div>
                  <div class="w-full space-y-2 mt-6">
                    <div class="flex gap-2">
                      <div class="text-sm flex-1 flex flex-col gap-1 rounded-md bg-[var(--p-surface-50)] px-2.5 py-2">
                        <p class="font-semibold">YSC No</p>
                        <p>{{ currentProductData.location.location_id }}</p>
                      </div>
                      <div class="text-sm flex-1 flex flex-col gap-1 rounded-md bg-[var(--p-surface-50)] px-2.5 py-2">
                        <p class="font-semibold">Seri No</p>
                        <p>{{ currentProductData.product.serial_number }}</p>
                      </div>
                    </div>
                    <div class="text-sm flex-1 flex flex-col gap-1 rounded-md bg-[var(--p-surface-50)] px-2.5 py-2">
                        <p class="font-semibold">Dolum Periyodu</p>
                        <p>{{ formatRefillPeriod(currentProductData.product.refill_period)}}</p>
                    </div>
                  </div>
                  <!-- <div class="grid w-full grid-cols-2 gap-2.5">
                    <div
                      v-for="item in currentProductSummaryCardData"
                      :key="item.key"
                      :class="[
                        'flex min-w-0 flex-col items-start gap-1 rounded-xl bg-[color-mix(in_srgb,var(--p-surface-400)_12%,white)] px-3.5 py-3',
                        isCompactSummaryKey(item.key) ? '' : 'col-span-2',
                      ]"
                    >
                      <p
                        class="m-0 text-[0.78rem] font-semibold text-[var(--p-surface-600)]"
                      >
                        {{ item.key }}
                      </p>
                      <p
                        class="m-0 break-words text-[0.92rem] font-bold text-[var(--p-surface-800)]"
                      >
                        {{ item.value }}
                      </p>
                    </div>
                  </div> -->
                </div>
              </div>

              <Divider align="center">
                <i class="ri-swap-line text-3xl" />
              </Divider>

              <div
                class="mb-12 rounded-2xl bg-[linear-gradient(180deg,color-mix(in_srgb,var(--p-green-400)_16%,white)_0%,color-mix(in_srgb,var(--p-green-400)_8%,white)_100%)] p-1"
              >
                <div
                  class="flex items-center gap-2 px-4 pb-1 pt-2 text-[var(--p-green-900)]"
                >
                  <i class="ri-checkbox-circle-fill" />
                  <h5 class="font-semibold text-sm">Yeni</h5>
                </div>
                <div
                  v-if="newProductData.location && newProductData.product"
                  class="flex flex-col items-start gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
                >
                  <h3 class="font-semibold text-lg truncate">
                    {{
                      newProductData.product.model_type || "Model bilgisi yok"
                    }}
                    ·
                    {{
                      newProductData.product.unit
                        ? `${newProductData.product.unit}`
                        : "Birim belirtilmemiş"
                    }}
                  </h3>
                  <div class="flex items-start space-x-1 text-sm">
                    <i class="ri-map-pin-line" />
                    <p>
                      {{
                        toTitleCase(newProductData.location?.building_id?.name)
                      }}
                      /
                      {{ toTitleCase(newProductData.location.room) }}
                    </p>
                  </div>
                  <div class="grid w-full grid-cols-2 gap-2.5">
                    <div
                      v-for="item in newProductSummaryCardData"
                      :key="item.key"
                      :class="[
                        'flex min-w-0 flex-col items-start gap-1 rounded-xl bg-[color-mix(in_srgb,var(--p-green-400)_12%,white)] px-3.5 py-3',
                        isCompactSummaryKey(item.key) ? '' : 'col-span-2',
                      ]"
                    >
                      <p
                        class="m-0 text-[0.78rem] font-semibold text-[var(--p-surface-600)]"
                      >
                        {{ item.key }}
                      </p>
                      <p
                        class="m-0 break-words text-[0.92rem] font-bold text-[var(--p-green-900)]"
                      >
                        {{ item.value }}
                      </p>
                    </div>
                  </div>
                  <Accordion value="0" class="mt-1">
                    <AccordionPanel value="0">
                      <AccordionHeader
                        ><span class="text-sm font-medium"
                          >Dolum periyodunu güncelle</span
                        ></AccordionHeader
                      >
                      <AccordionContent>
                        <div class="m-0 pt-4">
                          <Select
                            id="new-product-refill-period"
                            v-model="selectedNewProductRefillPeriod"
                            :options="refillPeriodOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="Periyot secin"
                            size="small"
                            fluid
                          />
                          <Button
                            label="Periyodu guncelle"
                            icon="ri-refresh-line"
                            size="small"
                            class="mt-3"
                            fluid
                            :disabled="!isRefillPeriodDirty"
                            @click="updateNewProductRefillPeriod"
                          />
                        </div>
                      </AccordionContent>
                    </AccordionPanel>
                  </Accordion>
                </div>
                <div
                  v-else
                  class="px-4 py-6 rounded-xl bg-[var(--p-green-50)] text-center text-sm"
                >
                  Yeni YSC bilgisi bulunamadi.
                </div>
              </div>
              <!-- <div class="mb-8 rounded-xl border p-4 app-border">
                <h5 class="mb-3 text-base font-semibold app-text">
                  Yeni urun dolum periyodunu guncelle
                </h5>
                <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div class="w-full sm:max-w-xs">
                    <label
                      for="new-product-refill-period"
                      class="mb-1 block text-sm app-text-muted"
                    >
                      Dolum periyodu
                    </label>
                    <Select
                      id="new-product-refill-period"
                      v-model="selectedNewProductRefillPeriod"
                      :options="refillPeriodOptions"
                      option-label="label"
                      option-value="value"
                      placeholder="Periyot secin"
                      class="w-full"
                    />
                  </div>
                  <Button
                    label="Periyodu guncelle"
                    icon="ri-refresh-line"
                    :disabled="!isRefillPeriodDirty"
                    @click="updateNewProductRefillPeriod"
                  />
                </div>
              </div> -->

              <div class="flex justify-between pt-8">
                <Button
                  label="Geri"
                  severity="secondary"
                  icon="ri-arrow-left-line"
                  @click="activeStep = '1'"
                />
                <Button
                  label="Devam et"
                  icon="ri-arrow-right-line"
                  icon-pos="right"
                  :disabled="
                    !newProductData.location || !newProductData.product
                  "
                  @click="activeStep = '3'"
                />
              </div>
            </StepPanel>

            <StepPanel value="3">
              <h4 class="mb-4 mt-10 font-semibold app-text-muted">
                Son adimdasin. Yeni YSC nin fotografini ekle ve degisim islemini
                tamamla.
              </h4>

              <div class="card flex flex-col items-center gap-6">
                <FileUpload
                  mode="basic"
                  custom-upload
                  auto
                  accept="image/*"
                  class="p-button-outlined p-button-secondary"
                  choose-label="Cihazin fotografini cek/yukle"
                  :pt="{ input: { capture: 'environment' } }"
                  @select="onFileSelect"
                >
                  <template #chooseicon>
                    <i class="ri-camera-line" />
                  </template>
                </FileUpload>

                <img
                  v-if="photoPreviewUrl"
                  :src="photoPreviewUrl"
                  alt="Image"
                  class="w-64 rounded-xl shadow-md sm:w-12"
                />
              </div>

              <div class="mt-12 flex justify-between border-t pt-4 app-border">
                <Button
                  label="Geri"
                  severity="secondary"
                  icon="ri-arrow-left-line"
                  @click="activeStep = '2'"
                />
                <Button
                  icon="ri-check-line"
                  icon-pos="right"
                  label="Degisim islemini tamamla"
                  :loading="submitting"
                  @click="finalizeChange"
                />
              </div>
            </StepPanel>
          </StepPanels>
        </Stepper>
      </template>
    </div>

    <TransactionsSuccessDialog
      :visible="successVisible"
      title="Degisim islemi basariyla tamamlandi!"
    />
  </div>
</template>

<style scoped>
.mobile-change-stepper :deep(.p-step[data-p~="completed"] .p-step-number) {
  font-size: 0;
  background-color: var(--p-surface-300);
}

.mobile-change-stepper
  :deep(.p-step[data-p~="completed"] .p-step-number::before) {
  content: "";
  width: 0.45rem;
  height: 0.8rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  display: block;
  margin-top: -0.1rem;
}

@media (max-width: 640px) {
  .mobile-change-stepper :deep(.p-step) {
    justify-content: center;
  }

  .mobile-change-stepper :deep(.p-step-header) {
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .mobile-change-stepper :deep(.p-step-title) {
    white-space: normal;
    line-height: 1.2;
    text-align: center;
  }
}
</style>
