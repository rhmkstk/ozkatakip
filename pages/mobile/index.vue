
<script setup lang="ts">
import { Html5Qrcode } from "html5-qrcode";

definePageMeta({
  layout: "mobile",
});

const productId = ref<string | null>("");
const showScanner = ref(false);
const router = useRouter();
let scanner: Html5Qrcode | null = null;

import { nextTick } from 'vue';

const startScanner = async () => {
  showScanner.value = true;

  await nextTick(); // ✅ Wait for <div id="qr-reader"> to be rendered

  const qrRegionId = "qr-reader";

  try {
    scanner = new Html5Qrcode(qrRegionId);
    await scanner.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: 250,
      },
      (decodedText: string) => {
        scanner?.stop().then(() => {
          scanner?.clear();
          showScanner.value = false;
          const scannedNumber = decodedText.trim();
          // TODO: check if the scanned number is a valid ysn number
          if (!scannedNumber) {
            console.warn("Scanned number is empty or invalid.");
            return;
          }
          router.push(`/mobile/transactions/${scannedNumber}`);
        });
      },
      (errorMessage) => {
        console.warn(errorMessage);
      }
    );
  } catch (err) {
    console.error("Camera access or scanner error:", err);
    showScanner.value = false;
  }
};
</script>

<template>
  <div class="flex flex-col space-y-4 h-full pb-24">
    <span
      class="text-center text-4xl font-bold border-2 rounded-2xl p-3 w-max mx-auto text-blue-600"
      >ÖT</span
    >
    <form class="mt-auto w-full" @submit.prevent>
       <!-- Scanner Container -->
    <div
      v-if="showScanner"
      id="qr-reader"
      class="mt-4 rounded-lg overflow-hidden"
      style="width: 100%; max-width: 400px; margin: auto"
    ></div>
      <div class="form-row">
        <div class="form-item">
          <label for="building_area">YSC no</label>
          <InputText
            id="building_area"
            v-model="productId"
            placeholder="ATM-2"
            size="large"
          />
        </div>
      </div>
      <Button
        label="Ara"
        size="large"
        class="mt-4 w-full"
        @click="$router.push(`/mobile/transactions/${productId}`)"
      />
    </form>

    <Divider />
    <!-- QR Scan Button -->
    <Button
      class="mt-4"
      icon="ri-camera-fill"
      label="Kamera"
      size="large"
      @click="startScanner"
    />

   
  </div>
</template>