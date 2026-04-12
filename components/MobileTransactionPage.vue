<script setup lang="ts">
import imageCompression from "browser-image-compression";
import type { FileUploadSelectEvent } from "primevue";
import type { Database } from "~/types/database.types";
import type {
  MobileFillPayload,
  MobileInspectionPayload,
} from "~/types/mobile-transaction";
import {
  imageCompressionOptions,
  inspectionFormFields,
  fillFormFields,
  productStatusTypeLabels,
} from "~/constants";
import { useMobileTransactionContext } from "~/composables/use-mobile-transaction-context";
import { useMobileTransactionActions } from "~/composables/use-mobile-transaction-actions";
import { useMobileOfflineState } from "~/composables/use-mobile-offline-state";

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const { toTenantPath } = useTenant();
const {
  submitInspection,
  submitFill,
} = useMobileTransactionActions();
const { isOnline, pendingCount, syncNow } = useMobileOfflineState();
const activeTab = ref("0");
const compressedImage = ref<File | null>(null);
const inspectionFormLoading = ref(false);
const drawersShow = reactive({
  change: false,
  success: false,
  needChange: false,
});

const inspectionForm = reactive({
  fire_extinguisher_id: null,
  position: true,
  is_expiry: true,
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
  photo_url: null,
  user_id: null,
});

const fillForm = reactive({
  filling: false,
  trigger_valve: false,
  manometer: false,
  hose_and_nozzle: false,
  wheel: false,
  paint: false,
  hydrostatic_pressure_test: false,
  user_id: null,
});

const isLoading = computed(() => {
  return (
    status.value === "pending" ||
    status.value === "idle" ||
    inspectionFormLoading.value
  );
});

const statusBgColors: Record<
  Database["public"]["Enums"]["product_status"],
  string
> = {
  active: "bg-green-600",
  damaged: "bg-red-600",
  lost: "bg-gray-500",
  spare: "bg-yellow-500",
  scrap: "bg-gray-900",
};

const statusBgColor = computed(() => {
  const currentStatus = data.value?.product.current_status;
  return currentStatus ? statusBgColors[currentStatus] : "bg-gray-500";
});

const controlFields = [
  "position",
  "body",
  "control_card",
  "hose_and_nozzle",
  "instruction_and_label",
  "mass",
  "pin_and_seal",
  "pressure",
  "working_mechanism",
  "is_expiry",
];

const {
  data,
  status,
  showInspectionAlert,
  inspectionAlert,
  isRefillDateExpired,
  refillDateAlert,
  contextSource,
  hasCachedFallback,
} = await useMobileTransactionContext(String(route.params.id));

const locationId = computed(() => String(route.params.id));
const offlineBannerText = computed(() => {
  if (contextSource.value === "cache") {
    return "Cevrimdisi modda kayitli son urun bilgileri gosteriliyor.";
  }

  if (contextSource.value === "empty") {
    return "Bu YSC daha once cihaza alinmamis. Urun bilgileri bos olabilir; kayitlariniz kuyruga alinacak.";
  }

  return "";
});

const checkInspectionForm = () => {
  return controlFields.every(
    (field) => inspectionForm[field as keyof typeof inspectionForm] === true,
  );
};

async function onFileSelect(event: FileUploadSelectEvent) {
  const imageFile = event.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    if (e.target && e.target.result) {
      inspectionForm.photo_url = e.target.result as string;
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

async function saveInspectionForm() {
  const result = checkInspectionForm();
  inspectionFormLoading.value = true;
  try {
    const userId = (await supabase.auth.getUser()).data.user?.id;

    if (!userId) {
      throw new Error("Missing required inspection context");
    }

    const inspectionPayload: Omit<
      MobileInspectionPayload,
      "fire_extinguisher_id" | "photo_url" | "user_id"
    > = {
      ...inspectionForm,
      result,
      date: formatDateOnlyForApi(new Date()),
    };

    const response = await submitInspection({
      locationId: locationId.value,
      userId,
      inspection: inspectionPayload,
      photoFile: compressedImage.value,
      photoFileName: compressedImage.value?.name,
      photoFileType: compressedImage.value?.type,
    });

    if (response.mode === "queued") {
      toast.add({
        severity: "info",
        summary: "Kuyruga alindi",
        detail: "Bakim kaydi internet geldiginde gonderilecek.",
        life: 2500,
      });
      await syncNow();
    }

    inspectionFormLoading.value = false;
    if (result) {
      drawersShow.success = true;
      return;
    } else {
      drawersShow.needChange = true;
    }
  } catch {
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Bakim kaydı oluşturulurken bir hata oluştu.",
      life: 2000,
    });
  }
}

async function saveFillRecord() {
  const isAnyItemSelected = Object.values(fillForm).some(
    (value) => typeof value === "boolean" && value === true,
  );
  if (!isAnyItemSelected) {
    toast.add({
      severity: "warn",
      summary: "Uyarı",
      detail: "Dolum kaydı oluşturmak için en az bir alan seçilmelidir.",
      life: 2000,
    });
    return;
  }
  inspectionFormLoading.value = true;
  const userId = (await supabase.auth.getUser()).data.user?.id;
  try {
    if (!userId) {
      throw new Error("Missing required fill context");
    }

    const fillPayload: Omit<MobileFillPayload, "product_id" | "user_id"> = {
      ...fillForm,
    };

    const response = await submitFill({
      locationId: locationId.value,
      userId,
      fill: fillPayload,
    });

    if (response.mode === "queued") {
      toast.add({
        severity: "info",
        summary: "Kuyruga alindi",
        detail: "Dolum kaydi internet geldiginde gonderilecek.",
        life: 2500,
      });
      await syncNow();
    }

    drawersShow.success = true;
  } catch (error) {
    console.error("Error saving fill record:", error);
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Dolum kaydı oluşturulurken bir hata oluştu.",
      life: 2000,
    });
  } finally {
    inspectionFormLoading.value = false;
  }
}
</script>

<template>
  <div class="h-full">
    <BaseLoader v-if="isLoading" />
    <header class="flex items-center space-x-2 mb-6">
      <Button
        icon="ri-arrow-left-fill"
        severity="secondary"
        label="Geri"
        aria-label="go back"
        @click="$router.push(toTenantPath('/mobile'))"
      />
    </header>
    <div v-if="!isLoading" class="flex flex-col h-full">
      <div
        v-if="status === 'error' && isOnline && contextSource === 'network'"
        class="py-2 flex flex-col gap-y-8"
      >
        <p class="text-lg">
          Aradiginiz YSC bulunamadi! Geri donup farkli mevcut bir YSC ile islem
          yapabilirsiniz
        </p>
        <Button label="Geri" @click="$router.push(toTenantPath('/mobile'))" />
      </div>
      <template v-else>
      <Message v-if="isOnline && pendingCount > 0" severity="info" class="mb-4">
        {{ pendingCount }} islem senkronizasyon icin bekliyor.
      </Message>
      <Message
        v-if="contextSource !== 'network'"
        severity="secondary"
        class="mb-4"
      >
        {{ offlineBannerText }}
      </Message>
      <div
        v-if="data?.product"
        class="bg-slate-50 p-2 rounded-lg mb-4"
      >
        <div
          class="px-1 pb-2 mb-3 border-b border-slate-200 flex items-start justify-between gap-2"
        >
          <div class="min-w-0">
            <h3 class="text-base font-semibold truncate">
              {{ data.product.model_type || "Model bilgisi yok" }}
            </h3>
            <h4 class="text-sm text-slate-600">
              {{ data.product.unit ? `${data.product.unit}` : "Birim belirtilmemiş" }}
            </h4>
          </div>
            <div class="flex items-center space-x-1 shrink-0">
              <span class="size-1.5 rounded-full" :class="statusBgColor" />
              <span class="text-xs text-slate-500 uppercase">{{
              data.product.current_status
                ? productStatusTypeLabels[
                    data.product
                      .current_status as keyof typeof productStatusTypeLabels
                  ]
                : "BILGI YOK"
            }}</span>
          </div>
        </div>

        <div class="flex items-stretch gap-3 min-h-[220px]">
          <div class="w-[34%] max-w-[140px] rounded overflow-hidden">
            <img
              src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
              alt="fire-estinguisher"
              class="object-cover w-full h-full"
            />
          </div>

          <div class="flex-1 flex flex-col justify-between py-1">
            <div class="flex space-x-1">
              <i class="ri-map-pin-line -mt-0.5" />
              <p class="text-sm text-gray-700">
                Konum:
                <b>{{ data.location.room || "Belirtilmemiş" }} , {{ data.location.building_id?.name || "Belirtilmemiş" }}</b>
              </p>
            </div>
            <div class="flex space-x-1 mt-1">
              <i class="ri-calendar-line -mt-0.5" />
              <p class="text-sm text-gray-700">
                Dolum tarihi:
                <b>{{ formatTurkishDate(data.product.refill_date) }}</b>
              </p>
            </div>
            <div class="flex space-x-1 mt-1">
              <i class="ri-calendar-check-line -mt-0.5" />
              <p class="text-sm text-gray-700">
                Test tarihi:
                <b>{{
                  data.product.hydrostatic_test_date
                    ? formatTurkishDate(data.product.hydrostatic_test_date)
                    : "Belirtilmemiş"
                }}</b>
              </p>
            </div>
            <div class="flex space-x-1 mt-1">
              <i class="ri-hashtag -mt-0.5" />
              <p class="text-sm text-gray-700">
                Seri No:
                <b>{{ data.product.serial_number ?? "Belirtilmemiş" }}</b>
              </p>
            </div>
            <div class="flex space-x-1 mt-1">
              <i class="ri-refresh-line -mt-0.5"></i>
              <p class="text-sm text-gray-700">
                Dolum periyodu: <b>{{ data.product.refill_period ? `${data.product.refill_period} yıl` : "Belirtilmemiş" }}</b>
              </p>
            </div>
            <div class="flex space-x-1 mt-1">
              <i class="ri-calendar-todo-line -mt-0.5"></i>
              <p class="text-sm text-gray-700">
                SKT: <b>{{ formatTurkishDate(data.product.next_refill_date) }}</b>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Message v-if="isRefillDateExpired" severity="error" class="my-4">
        {{ refillDateAlert }}
      </Message>
      <Message v-if="showInspectionAlert && hasCachedFallback" severity="warn" class="my-4">
        {{ inspectionAlert }}
      </Message>
	      <div class="card">
	        <Tabs v-model:value="activeTab">
          <TabList>
            <Tab value="0" class="w-1/2"> Bakım kayıt </Tab>
            <Tab value="1" class="w-1/2"> Dolum kayıt </Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="0">
              <form class="space-y-4 m-0" @submit.prevent>
                <div
                  v-for="field in inspectionFormFields"
                  :key="field.key"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    v-model="
                      inspectionForm[field.key as keyof typeof inspectionForm]
                    "
                    :input-id="field.key"
                    binary
                  />
                  <label :for="field.key"> {{ field.label }} </label>
                </div>

                <div class="flex flex-col gap-2">
                  <label for="note"> Not </label>
                  <Textarea v-model="inspectionForm.note" rows="3" />
                </div>
                <div class="flex flex-col items-start gap-2">
                  <FileUpload
                    mode="basic"
                    custom-upload
                    auto
                    accept="image/*"
                    class="p-button-outlined p-button-secondary"
                    choose-label="Cihazın fotoğrafını çek/yükle"
                    :pt="{ input: { capture: 'environment' } }"
                    @select="onFileSelect"
                  >
                    <template #chooseicon>
                      <i class="ri-camera-line" />
                    </template>
                  </FileUpload>
                  <img
                    v-if="inspectionForm.photo_url"
                    :src="inspectionForm.photo_url"
                    alt="Image"
                    class="shadow-md rounded-xl w-64 sm:w-12"
                  />
                </div>
                <Button
                  class="w-full mt-4"
                  label="Bakim kaydi olustur"
                  @click="saveInspectionForm"
                />
              </form>
            </TabPanel>
            <TabPanel value="1">
              <form class="space-y-4 m-0" @submit.prevent>
                <div
                  v-for="field in fillFormFields"
                  :key="field.key"
                  class="flex items-center gap-2"
                >
                  <Checkbox
                    v-model="fillForm[field.key as keyof typeof fillForm]"
                    :input-id="field.key"
                    binary
                  />
                  <label :for="field.key"> {{ field.label }} </label>
                </div>
                <Button
                  class="w-full mt-4"
                  label="Dolum kaydi olustur"
                  @click="saveFillRecord"
                />
              </form>
            </TabPanel>
          </TabPanels>
	        </Tabs>
	      </div>
	      </template>
	    </div>
	    <Drawer
      v-model:visible="drawersShow.change"
      header="Degisim"
      position="full"
      style="height: auto"
    >
      <InspectionStepper
        v-if="data?.product && data?.location"
        :current-product-data="{
          product: data.product,
          location: data.location,
        }"
        @close="drawersShow.change = false"
      />
    </Drawer>
    <TransactionInfoDialog
      v-model:is-active="drawersShow.needChange"
      @open-change-dialog="drawersShow.change = true"
    />
    <TransactionsSuccessDialog
      :visible="drawersShow.success"
      :title="
        activeTab === '0'
          ? 'Bakim kaydi basariyla olusturuldu!'
          : 'Dolum kaydi basariyla olusturuldu!'
	      "
	      @close="drawersShow.success = false"
	    />
	  </div>
</template>
