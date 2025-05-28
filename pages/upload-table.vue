<script setup lang="ts">
import { ref } from 'vue';
import * as XLSX from 'xlsx';
import ExcelTable from '../components/ExcelTable.vue';

const selectedFile = ref(null);
const excelData = ref(null);

const handleFileUpload = async (event) => {
	const file = event.target.files[0];
	if (file) {
		selectedFile.value = file;

		try {
			// Dosyayı binary string olarak okuyoruz
			const data = await file.arrayBuffer();

			// Excel dosyasını parse ediyoruz
			const workbook = XLSX.read(data);

			// İlk sayfayı alıyoruz
			const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

			// JSON formatına çeviriyoruz
			const jsonData = XLSX.utils.sheet_to_json(firstSheet);

			excelData.value = jsonData;
			const parsedData = mapExcelData(jsonData.slice(2, 12));
			console.log('parsedData', parsedData);
		}
		catch (error) {
			console.error('Dosya okuma hatası:', error);
			alert('Dosya okunurken bir hata oluştu!');
		}
	}
};
</script>

<template>
	<div>
		<h1>Selam</h1>
		<nuxt-link to="/data-create">create data</nuxt-link>

		<div class="file-upload-container">
			<label
				for="excel-file"
				class="file-label"
			>Excel Dosyası Seç</label>
			<input
				id="excel-file"
				type="file"
				accept=".xlsx,.xls,.ods,.csv"
				class="file-input"
				@change="handleFileUpload"
			>
			<p
				v-if="selectedFile"
				class="selected-file"
			>
				Seçilen dosya: {{ selectedFile.name }}
			</p>
		</div>

		<!-- Excel verisi için tablo -->
		<ExcelTable
			v-if="excelData && excelData.length"
			:data="excelData"
		/>

		<!-- JSON önizleme -->
		<div
			v-if="excelData"
			class="excel-data"
		>
			<h2>JSON Önizleme</h2>
			<pre>{{ JSON.stringify(excelData, null, 2) }}</pre>
		</div>
	</div>
</template>

<style>
.file-upload-container {
  margin: 20px auto;
  max-width: 900px;
}

.file-label {
  display: inline-block;
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
}

.file-input {
  display: none;
}

.selected-file {
  margin-top: 10px;
  color: #666;
}

.excel-data {
  margin-top: 20px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.excel-data pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
}
</style>
