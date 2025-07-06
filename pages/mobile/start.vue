<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});

// const tabledata = ref([]);
// const columns = [
// 	{
// 		accessorKey: 'locations.location_id',
// 		header: 'YSC no',
// 	},
// 	{
// 		accessorKey: 'model_type',
// 		header: 'Modeli / tipi',
// 	},
// 	{
// 		accessorKey: 'locations.building_area',
// 		header: 'Bulunduğu bina / alan',
// 	},
// 	{
// 		accessorKey: 'locations.location',
// 		header: 'Bulunduğu yer/Lokasyon',
// 	},
// ];

const onUpload = (event: Event) => {
	const file = event.files[0];
	if (file) {
		console.log('File uploaded:', file);
		// Handle the file upload logic here
	}
};
</script>

<template>
	<div class="flex flex-col h-full">
		<header class="flex items-center space-x-2 mb-6">
			<Button
				icon="ri-arrow-left-fill"
				severity="secondary"
				aria-label="go back"
				@click="$router.back()"
			/>
			<!-- <Button
				label="Geri"
				icon="ri-arrow-left-s-line"
				severity="secondary"
				@click="$router.back()"
			/> -->
			<Button
				class="ml-auto"
				label="Dolum kaydi"
				severity="contrast"
				@click="$router.back()"
			/>
			<Button
				label="Degisim"
				severity="contrast"
				@click="$router.back()"
			/>
		</header>
		<Card
			header="Urun ozet"
			title="Urun ozet"
		>
			<template #content>
				<div>
					<ul class="space-y-2">
						<li>AT-3</li>
						<li>6 KG ABC KURU KİMYEVİ TOZLU	</li>
						<li>ALTINSAR TEKSTİL 3. BÖLGE		</li>
						<li>TEXTURE BÖLÜMÜ GİRİŞ YANGIN DOLABI</li>
					</ul>
				</div>
				<!-- <div class="overflow-x-auto">
					<DataTable
						:value="tabledata"
						striped-rows
						size="small"
						class="text-sm"
					>
						<Column
							v-for="item in columns"
							:key="item.accessorKey"
							:field="item.accessorKey"
							:header="item.header.toUpperCase()"
						/>
					</DataTable>
				</div> -->
			</template>
		</Card>
		<div class="mt-auto">
			<form
				class="py-8 space-y-4"
				@submit.prevent
			>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="pressure_source"
						name="pressure_source"
					/>
					<label for="pressure_source"> Basinc kaynagi </label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="working_pressure_bar"
						name="working_pressure_bar"
					/>
					<label for="working_pressure_bar"> Calisma basinci(Bar) </label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="manometer_scale_bar"
						name="manometer_scale_bar"
					/>
					<label for="manometer_scale_bar"> Monometre skala buyuklugu(Bar) </label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="test_pressure_bar"
						name="test_pressure_bar"
					/>
					<label for="test_pressure_bar"> Test basıncı(Bar) </label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="safety_valve_setting_pressure_bar"
						name="safety_valve_setting_pressure_bar"
					/>
					<label for="safety_valve_setting_pressure_bar"> Emniyet valfi ayar basinci(Bar) </label>
				</div>
				<div class="flex items-center gap-2">
					<Checkbox
						input-id="working_temperature_celsius"
						name="working_temperature_celsius"
					/>
					<label for="working_temperature_celsius"> Calisma sicaklik araligi(°C) </label>
				</div>
				<div class="flex flex-col gap-2">
					<label for="note"> Not </label>
					<Textarea
						rows="3"
					/>
				</div>
				<div class="flex">
					<FileUpload
						ref="fileupload"
						mode="basic"
						name="demo[]"
						url="/api/upload"
						accept="image/*"
						severity="secondary"
						choose-label="Fotoğraf yükle"
						:max-file-size="1000000"
						@upload="onUpload"
					/>
				</div>
			</form>
			<Button
				size="large"
				class="w-full"
				label="Bakim kaydi olustur"
			/>
		</div>
	</div>
</template>
