<script setup lang="ts">
import { headerLabels } from "~/constants";

const tabledata = ref([]);
const expandedRows = ref([]);
const isLoading = ref(false);
const showFilters = ref(false);
const filterOptions = ref({
  buildings: [] as string[],
  units: [] as string[],
  modelTypes: [] as string[],
});

const defaultDate = new Date();
const filters = reactive({
  dateMode: "none",
  date: new Date(defaultDate),
  building: "",
  weight: "",
  modelType: "",
  result: null as null | boolean,
});

const dateModeOptions = [
  { label: "Kapalı", value: "none" },
  { label: "Günlük", value: "daily" },
  { label: "Aylık", value: "monthly" },
];

const resultOptions = [
  { label: "Uygun", value: true },
  { label: "Uygunsuz", value: false },
];

const hasActiveFilters = computed(() => {
  return (
    Boolean(filters.building) ||
    Boolean(filters.weight) ||
    Boolean(filters.modelType) ||
    filters.result !== null ||
    filters.dateMode !== "none"
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.building) count += 1;
  if (filters.weight) count += 1;
  if (filters.modelType) count += 1;
  if (filters.result !== null) count += 1;
  if (filters.dateMode !== "none") count += 1;
  return count;
});

const getDateRangeQuery = () => {
  if (filters.dateMode === "none" || !filters.date) {
    return {};
  }
  const toDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const selectedDate = new Date(filters.date);
  if (filters.dateMode === "daily") {
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
      date_from: toDateString(start),
      date_to: toDateString(end),
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
    date_from: toDateString(start),
    date_to: toDateString(end),
  };
};

const buildQuery = () => {
  if (!hasActiveFilters.value) {
    return {};
  }
  const query: Record<string, string> = {
    ...getDateRangeQuery(),
  };

  if (filters.building) {
    query.building = filters.building.trim();
  }
  if (filters.weight) {
    query.unit = filters.weight.trim();
  }
  if (filters.modelType) {
    query.model_type = filters.modelType.trim();
  }
  if (filters.result !== null) {
    query.result = String(filters.result);
  }
  return query;
};

const loadInspections = async () => {
  isLoading.value = true;
  try {
    const data = await $fetch("/api/inspections", {
      query: buildQuery(),
    });
    tabledata.value = Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching data:", error);
    tabledata.value = [];
  } finally {
    isLoading.value = false;
  }
};

const applyFilters = async () => {
  showFilters.value = false;
  await loadInspections();
};

const clearFilters = async () => {
  filters.dateMode = "none";
  filters.date = new Date(defaultDate);
  filters.building = "";
  filters.weight = "";
  filters.modelType = "";
  filters.result = null;
  showFilters.value = false;
  await loadInspections();
};

const loadFilterOptions = async () => {
  try {
    const data = await $fetch("/api/inspections/filters");
    filterOptions.value = {
      buildings: data?.buildings ?? [],
      units: data?.units ?? [],
      modelTypes: data?.modelTypes ?? [],
    };
  } catch (error) {
    console.error("Error fetching filter options:", error);
  }
};

await loadInspections();
await loadFilterOptions();


const columns = [
  {
    accessorKey: "products.locations.building_id.name",
    header: headerLabels.building_area,
  },
  {
    accessorKey: "products.locations.room",
    header: headerLabels.location,
  },
  {
    accessorKey: "products.locations.location_id",
    header: headerLabels.location_id,
  },
  {
    accessorKey: "created_at",
    header: headerLabels.date,
  },
  {
    accessorKey: "products.unit",
    header: headerLabels.unit,
  },
  {
    accessorKey: "products.model_type",
    header: headerLabels.model_type,
  },
  {
    accessorKey: "products.refill_date",
    header: headerLabels.refill_date,
  },
  {
    accessorKey: "products.next_refill_date",
    header: headerLabels.next_refill_date,
  },
  {
    accessorKey: "result",
    header: headerLabels.result,
  },
];

const expandColumns = [
  {
    accessorKey: "photo_url",
    header: headerLabels.photo_url,
  },
  {
    accessorKey: "note",
    header: headerLabels.note,
  },
  {
    accessorKey: "body",
    header: headerLabels.body,
  },
  {
    accessorKey: "control_card",
    header: headerLabels.control_card,
  },
  {
    accessorKey: "hose_and_nozzle",
    header: headerLabels.hoze_and_nozzle,
  },
  {
    accessorKey: "instruction_and_label",
    header: headerLabels.instruction_and_label,
  },
  {
    accessorKey: "mass",
    header: headerLabels.mass,
  },
  {
    accessorKey: "pin_and_seal",
    header: headerLabels.pin_and_seal,
  },
  {
    accessorKey: "position",
    header: headerLabels.position,
  },
  {
    accessorKey: "pressure",
    header: headerLabels.pressure,
  },
  {
    accessorKey: "working_mechanism",
    header: headerLabels.working_mechanism,
  },
  {
    accessorKey: "is_expiry",
    header: headerLabels.is_expiry,
  },
];
</script>

<template>
  <div>
    <PageHeader title="Bakım kayıtları listeleniyor">
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
          <label class="text-sm font-medium text-gray-600">Kontrol tarihi</label>
          <Select v-model="filters.dateMode" :options="dateModeOptions" optionLabel="label" optionValue="value" />
        </div>
        <div v-if="filters.dateMode !== 'none'" class="flex flex-col gap-2">
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
          <label class="text-sm font-medium text-gray-600">Bulduğu bina/alan</label>
          <Select
            v-model="filters.building"
            :options="filterOptions.buildings"
            placeholder="Bina/alan seç"
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-600">Agirlik</label>
          <Select
            v-model="filters.weight"
            :options="filterOptions.units"
            placeholder="Agirlik seç"
            filter
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-600">Modeli/tipi</label>
          <Select
            v-model="filters.modelType"
            :options="filterOptions.modelTypes"
            placeholder="Modeli/tipi seç"
            filter
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-600">Sonuç</label>
          <Select
            v-model="filters.result"
            :options="resultOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Hepsi"
            show-clear
          />
        </div>
      </div>
      <div class="mt-6 flex items-center gap-2">
        <Button label="Temizle" severity="secondary" outlined @click="clearFilters" />
        <Button label="Uygula" :loading="isLoading" @click="applyFilters" />
      </div>
    </Drawer>
    <EmptyState v-if="!tabledata.length">
      <template #title> Bakım Kayıdı bulunamadı </template>
      <template #subtitle>
        Seçilen tarihler için bakım kayıdı bulunamadı.
      </template>
    </EmptyState>
    <div v-else class="overflow-x-auto">
      <DataTable
        v-model:expanded-rows="expandedRows"
        :value="tabledata"
        :loading="isLoading"
        class="text-sm"
        :row-class="(rowData) => (rowData.result ? '' : '!bg-red-100')"
      >
        <Column expander style="width: 3rem" />
        <Column
          v-for="item in columns"
          :key="item.accessorKey"
          :field="item.accessorKey"
          :header="item.header"
        >
          <template v-if="isCellCustom(item.accessorKey)" #body="slotProps">
            <CustomCell
              :field="item.accessorKey"
              :value="getValueByPath(slotProps.data, item.accessorKey)"
            />
          </template>
        </Column>
        <template #expansion="slotProps">
          <div class="p-4">
            <DataTable :value="[slotProps.data]" size="small">
              <Column
                v-for="item in expandColumns"
                :key="item.accessorKey"
                :field="item.accessorKey"
                :header="item.header"
              >
                <template
                  v-if="isCellCustom(item.accessorKey)"
                  #body="expandSlotProps"
                >
                  <CustomCell
                    :field="item.accessorKey"
                    :value="expandSlotProps.data[item.accessorKey]"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
