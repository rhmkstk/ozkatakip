<script lang="ts" setup>
import { headerLabels } from '~/constants';
import { isCellCustom } from '~/utils';

const tabledata = ref([]);
const date = ref(new Date());

const { error } = await useFetch('/api/transactions', {
	method: 'GET',
	onResponse({ response }) {
		if (response._data) {
			tabledata.value = response._data;
		}
		else {
			console.error('Error fetching data:', error);
		}
	},
});

const columns = [
	{
		accessorKey: 'created_at',
		header: headerLabels.transaction_date,
	},
	{
		accessorKey: 'type',
		header: headerLabels.type,
	},
	{
		accessorKey: 'details',
		header: headerLabels.details,
	},
	{
		accessorKey: 'user',
		header: headerLabels.user_id,
	},
	{
		accessorKey: 'product_id',
		header: headerLabels.product_id,
	},

];
</script>

<template>
	<div>
		<PageHeader title="2024 Nisan ayina ait kayitlar listeleniyor">
			<DatePicker
				v-model="date"
				view="month"
				date-format="mm/yy"
			/>
		</PageHeader>

		<EmptyState v-if="!tabledata.length">
			<template #title>
				İşlem Kayıdı bulunamadı
			</template>
			<template #subtitle>
				Seçilen tarihler için işlem kayıdı bulunamadı.
			</template>
		</EmptyState>
		<div
			v-else
			class="overflow-x-auto"
		>
			<DataTable
				:value="tabledata"
				striped-rows
				size="large"
				class="text-sm"
			>
				<Column
					v-for="item in columns"
					:key="item.accessorKey"
					:field="item.accessorKey"
					:header="item.header"
				>
					<template
						v-if="isCellCustom(item.accessorKey)"
						#body="slotProps"
					>
						<CustomCell
							:field="item.accessorKey"
							:value="slotProps.data[item.accessorKey]"
						/>
					</template>
				</Column>
			</DataTable>
		</div>
	</div>
</template>
