<script setup lang="ts">
import imageCompression from "browser-image-compression";
import type { FileUploadSelectEvent } from "primevue";
import {
  headerLabels,
  fillLabels,
  imageCompressionOptions,
  inspectionFormFields,
  fillFormFields,
} from "~/constants";

definePageMeta({
  layout: "mobile",
});

const route = useRoute();
const supabase = useSupabaseClient();
const toast = useToast();
const activeTab = ref("0");
const lastInspectionDate = ref<Date | null>(null);
const showInspectionAlert = ref(false);
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
  photo_url: null as string | null,
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
];

const { data, status } = await useAsyncData("product", async () => {
  const location = await $fetch("/api/locations/getByLocationId", {
    params: { location_id: route.params.id },
  });

  if (!location) {
    throw new Error("Location not found");
  }
  const product = await $fetch("/api/products/getByLocationId", {
    params: { location_id: location[0].id },
  });

  if (!product || product.length === 0) {
    throw new Error("Product not found");
  }

  return { product: product[0], location: location[0] };
});

const inspectionAlert = computed(() => {
  const formattedDate = lastInspectionDate.value
    ? new Date(lastInspectionDate.value).toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";

  return `  Bu YSC numarasina ${formattedDate} tarihinde bir bakım kaydı girilmiş. Yine de bakım kaydı oluşturmak istiyor musunuz?`;
});

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
      imageCompressionOptions
    );
    compressedImage.value = compressedFile as File;
  } catch (error) {
    console.warn(error);
  }
}

async function saveInspectionForm() {
  const result = controlFields.every(
    (field) => inspectionForm[field as keyof typeof inspectionForm] === true
  );
  inspectionFormLoading.value = true;
  try {
    const token = (await supabase.auth.getSession()).data.session?.access_token;

    if (compressedImage.value) {
      const formData = new FormData();
      formData.append("file", compressedImage.value);

      const uploadImageResponse = await fetch("/api/upload/inspection-photo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const result = await uploadImageResponse.json();
      inspectionForm.photo_url = result?.signedUrl || null;
    }
    const response = await $fetch("/api/inspections", {
      method: "POST",
      body: {
        ...inspectionForm,
        fire_extinguisher_id: data.value?.product.id,
        result,
      },
    });

    const userId = (await supabase.auth.getUser()).data.user?.id;

    $fetch("/api/transactions", {
      method: "POST",
      body: {
        type: "bakım",
        user: userId,
        product_id: data.value?.product.id,
        details: response.id,
      },
    });

    if (response) {
      inspectionFormLoading.value = false;
      if (result) {
        drawersShow.success = true;
        return;
      } else {
        drawersShow.needChange = true;
      }
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
    (value) => typeof value === "boolean" && value === true
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
  try {
    const response = await $fetch("/api/fill", {
      method: "POST",
      body: {
        ...fillForm,
        product_id: data.value?.product.id,
      },
    });

    if (response) {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      $fetch("/api/transactions", {
        method: "POST",
        body: {
          type: "dolum",
          user: userId,
          product_id: data.value?.product.id,
          details: response.id,
        },
      });
      inspectionFormLoading.value = false;
      drawersShow.success = true;
    }
  } catch (error) {
    console.error("Error saving fill record:", error);
    toast.add({
      severity: "error",
      summary: "Hata",
      detail: "Dolum kaydı oluşturulurken bir hata oluştu.",
      life: 2000,
    });
  }
}

function isInLast30Days(dateString: Date): boolean {
  const date = new Date(dateString);
  const now = new Date();

  // Calculate the timestamp for 30 days ago
  const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Check if date is after or equal to days30Ago and before or equal to now
  return date >= days30Ago && date <= now;
}

onMounted(async () => {
  const id = route.params.id as string;

  const data = await $fetch("/api/inspections/getByLocationId", {
    params: { location_id: id },
  });

  if (isInLast30Days(data[0].created_at)) {
    showInspectionAlert.value = true;
  }
});
</script>

<template>
  <div class="h-full">
    <BaseLoader
      v-if="status === 'pending' || status === 'idle' || inspectionFormLoading"
    />
    <div v-else class="flex flex-col h-full">
      <header class="flex items-center space-x-2 mb-6">
        <Button
          icon="ri-arrow-left-fill"
          severity="secondary"
          label="Geri"
          aria-label="go back"
          @click="$router.push('/mobile')"
        />
      </header>
      <div
        v-if="data?.product"
        class="bg-slate-100 p-2 rounded-lg space-x-3 mb-4 flex"
      >
        <img
          src="https://www.capitalsolutions.pk/wp-content/uploads/2021/06/DCP6Kg-ABC-2.jpg"
          alt="fire-estinguisher"
          class="object-cover max-w-full w-1/3 h-[200px] rounded"
        />
        <div class="pt-2 px-2 flex-1 flex flex-col">
          <h4 class="text-sm font-semibold leading-3">
            {{ data.product.unit }} KG
          </h4>
          <h3 class="text-lg font-semibold truncate">
            {{ data.product.model_type }}
          </h3>

          <div class="flex items-center space-x-1">
            <span class="size-1.5 rounded-full bg-green-600" />
            <span class="text-xs text-slate-500 uppercase">{{
              data.product.current_status
            }}</span>
          </div>
          <div class="flex space-x-1 mt-4">
            <i class="ri-map-pin-line -mt-0.5" />
            <span class="text-sm uppercase"
              >{{ data.location.room }} , {{ data.location.building_id.name }}
            </span>
          </div>
          <div class="flex space-x-1 mt-2">
            <i class="ri-calendar-line -mt-0.5" />
            <p class="text-sm text-gray-700">
              Dolum tarihi: <b>{{ data.product.refill_date }}</b
              >, Hidrastatik test tarihi:
              <b>{{ data.product.hydrostatic_test_date }}</b>
            </p>
          </div>
        </div>
      </div>
      <Message v-if="showInspectionAlert" severity="warn" class="my-4">
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
                    v-model="inspectionForm[field.key]"
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
                  <!-- auto attributesi dosyanin select olduktan hemen sonra otomatik olarak update olmasini sagliyor.
										Ayni zamanda yuklenen dosyanin isminin gozukmesini engelledigi icin kullandim. -->
                  <FileUpload
                    mode="basic"
                    custom-upload
                    auto
                    accept="image/*"
                    class="p-button-outlined"
                    choose-label="Resim sec"
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
                    v-model="fillForm[field.key]"
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
    </div>
    <Drawer
      v-model:visible="drawersShow.change"
      header="Degisim"
      position="full"
      style="height: auto"
    >
      <InspectionStepper
        :current-product-data="{
          product: data?.product,
          location: data?.location,
        }"
        @close="drawersShow.change = false"
      />
    </Drawer>
    <TransactionInfoDialog
      v-model:isActive="drawersShow.needChange"
      @openChangeDialog="drawersShow.change = true"
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
