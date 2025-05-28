<script setup lang="ts">
definePageMeta({
	layout: 'mobile',
});
</script>

<template>
	<div class="flex flex-col space-y-4">
		<h2>XXX tupu icin bakim kaydi olustur</h2>
		<div class="card flex flex-col space-y-2">
			<div class="flex items-center gap-2">
				<Checkbox
					input-id="ingredient1"
					name="pizza"
					value="Cheese"
				/>
				<label for="ingredient1"> Cheese </label>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					input-id="ingredient2"
					name="pizza"
					value="Mushroom"
				/>
				<label for="ingredient2"> Mushroom </label>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					input-id="ingredient3"
					name="pizza"
					value="Pepper"
				/>
				<label for="ingredient3"> Pepper </label>
			</div>
			<div class="flex items-center gap-2">
				<Checkbox
					input-id="ingredient4"
					name="pizza"
					value="Onion"
				/>
				<label for="ingredient4"> Onion </label>
			</div>
		</div>
		<Textarea
			placeholder="note"
			rows="5"
			cols="30"
		/>
		<Button label="Kaydet" />
	</div>
</template>
