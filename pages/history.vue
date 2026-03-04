<script lang="ts" setup>
import { headerLabels, transactionTypeLabels } from '~/constants';
import { isCellCustom } from '~/utils';

const tabledata = ref([]);
const isLoading = ref(false);
const showFilters = ref(false);
const { getUserNameById, loadUserDirectory } = useUserDirectory();
const filterOptions = ref({
	types: [] as string[],
	users: [] as string[],
});

const defaultDate = new Date();
const filters = reactive({
	dateMode: 'none',
	date: new Date(defaultDate),
	type: '',
	user: '',
});

const dateModeOptions = [
	{ label: 'Kapalı', value: 'none' },
	{ label: 'Günlük', value: 'daily' },
	{ label: 'Aylık', value: 'monthly' },
];

const typeOptions = computed(() => {
	return filterOptions.value.types.map(type => ({
		value: type,
		label: transactionTypeLabels[type as keyof typeof transactionTypeLabels] || type,
	}));
});

const userOptions = computed(() => {
	return filterOptions.value.users.map(user => ({
		value: user,
		label: getUserNameById(user),
	}));
});

const hasActiveFilters = computed(() => {
	return Boolean(filters.type) || Boolean(filters.user) || filters.dateMode !== 'none';
});

const activeFilterCount = computed(() => {
	let count = 0;
	if (filters.type) count += 1;
	if (filters.user) count += 1;
	if (filters.dateMode !== 'none') count += 1;
	return count;
});

const getDateRangeQuery = () => {
	if (filters.dateMode === 'none' || !filters.date) {
		return {};
	}
	const selectedDate = new Date(filters.date);
	if (filters.dateMode === 'daily') {
		const start = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate(),
		);
		const end = new Date(
			selectedDate.getFullYear(),
			selectedDate.getMonth(),
			selectedDate.getDate() + 1,
		);
		return {
			date_from: start.toISOString(),
			date_to: end.toISOString(),
		};
	}

	const start = new Date(
		selectedDate.getFullYear(),
		selectedDate.getMonth(),
		1,
	);
	const end = new Date(
		selectedDate.getFullYear(),
		selectedDate.getMonth() + 1,
		1,
	);
	return {
		date_from: start.toISOString(),
		date_to: end.toISOString(),
	};
};

const buildQuery = () => {
	if (!hasActiveFilters.value) {
		return {};
	}
	const query: Record<string, string> = {
		...getDateRangeQuery(),
	};
	if (filters.type) {
		query.type = filters.type;
	}
	if (filters.user) {
		query.user = filters.user;
	}
	return query;
};

const loadTransactions = async () => {
	isLoading.value = true;
	try {
		const data = await $fetch('/api/transactions', {
			query: buildQuery(),
		});
		tabledata.value = Array.isArray(data) ? data : [];
	}
	catch (error) {
		console.error('Error fetching data:', error);
		tabledata.value = [];
	}
	finally {
		isLoading.value = false;
	}
};

const loadFilterOptions = async () => {
	try {
		const data = await $fetch('/api/transactions/filters');
		filterOptions.value = {
			types: data?.types ?? [],
			users: data?.users ?? [],
		};
	}
	catch (error) {
		console.error('Error fetching filter options:', error);
	}
};

const applyFilters = async () => {
	showFilters.value = false;
	await loadTransactions();
};

const clearFilters = async () => {
	filters.dateMode = 'none';
	filters.date = new Date(defaultDate);
	filters.type = '';
	filters.user = '';
	showFilters.value = false;
	await loadTransactions();
};

await loadTransactions();
await loadFilterOptions();
await loadUserDirectory();

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
		<PageHeader title="İşlem kayıtları listeleniyor">
			<template #right>
				<Button
					:outlined="!hasActiveFilters"
					size="small"
					@click="showFilters = true"
				>
					<i class="ri-filter-3-line text-base" />
					<span>Filtreler</span>
					<span
						v-if="activeFilterCount"
						class="ml-2 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full text-xs font-medium bg-white/70 text-gray-900"
					>
						{{ activeFilterCount }}
					</span>
				</Button>
				<Button
					v-if="hasActiveFilters"
					label="Temizle"
					icon="pi pi-times"
					size="small"
					severity="secondary"
					outlined
					@click="clearFilters"
				/>
			</template>
		</PageHeader>

		<Drawer
			v-model:visible="showFilters"
			header="Filtreler"
			position="left"
			:style="{ width: '22rem' }"
		>
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">İşlem tarihi</label>
					<Select
						v-model="filters.dateMode"
						:options="dateModeOptions"
						optionLabel="label"
						optionValue="value"
					/>
				</div>
				<div
					v-if="filters.dateMode !== 'none'"
					class="flex flex-col gap-2"
				>
					<label class="text-sm font-medium text-gray-600">Tarih</label>
					<DatePicker
						v-model="filters.date"
						:view="filters.dateMode === 'monthly' ? 'month' : 'date'"
						:date-format="filters.dateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
						size="small"
						show-button-bar
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">İşlem tipi</label>
					<Select
						v-model="filters.type"
						:options="typeOptions"
						optionLabel="label"
						optionValue="value"
						placeholder="İşlem tipi seç"
						show-clear
					/>
				</div>
				<div class="flex flex-col gap-2">
					<label class="text-sm font-medium text-gray-600">İşlemi yapan kullanıcı</label>
					<Select
						v-model="filters.user"
						:options="userOptions"
						optionLabel="label"
						optionValue="value"
						placeholder="Kullanıcı seç"
						filter
						show-clear
					/>
				</div>
			</div>
			<div class="mt-6 flex items-center gap-2">
				<Button
					label="Temizle"
					severity="secondary"
					outlined
					@click="clearFilters"
				/>
				<Button
					label="Uygula"
					:loading="isLoading"
					@click="applyFilters"
				/>
			</div>
		</Drawer>

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
				:loading="isLoading"
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
