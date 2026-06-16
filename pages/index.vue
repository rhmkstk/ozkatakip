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
  yscNo: "",
  result: null as null | boolean,
});
const yscNoSearch = ref("");
let yscSearchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

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
    Boolean(filters.yscNo) ||
    filters.result !== null ||
    filters.dateMode !== "none"
  );
});

const activeFilterCount = computed(() => {
  let count = 0;
  if (filters.building) count += 1;
  if (filters.weight) count += 1;
  if (filters.modelType) count += 1;
  if (filters.yscNo) count += 1;
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
  if (filters.yscNo) {
    query.ysc_no = filters.yscNo.trim();
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
  if (yscSearchDebounceTimer) {
    clearTimeout(yscSearchDebounceTimer);
    yscSearchDebounceTimer = null;
  }
  filters.dateMode = "none";
  filters.date = new Date(defaultDate);
  filters.building = "";
  filters.weight = "";
  filters.modelType = "";
  filters.yscNo = "";
  yscNoSearch.value = "";
  filters.result = null;
  showFilters.value = false;
  await loadInspections();
};

const applyYscSearch = async (value: string) => {
  const normalized = value.trim();
  if (filters.yscNo === normalized) {
    return;
  }
  filters.yscNo = normalized;
  await loadInspections();
};

const clearYscSearch = async () => {
  if (yscSearchDebounceTimer) {
    clearTimeout(yscSearchDebounceTimer);
    yscSearchDebounceTimer = null;
  }
  yscNoSearch.value = "";
  await applyYscSearch("");
};

watch(yscNoSearch, (value) => {
  if (yscSearchDebounceTimer) {
    clearTimeout(yscSearchDebounceTimer);
  }
  yscSearchDebounceTimer = setTimeout(() => {
    void applyYscSearch(value);
  }, 400);
});

onBeforeUnmount(() => {
  if (yscSearchDebounceTimer) {
    clearTimeout(yscSearchDebounceTimer);
  }
});

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

const expandedInfoColumns = expandColumns.filter(
  (item) => !["photo_url", "note"].includes(item.accessorKey),
);

const getExpandedInfoGroups = (data: Record<string, unknown>) => {
  const sortedColumns = [...expandedInfoColumns].sort((firstItem, secondItem) => {
    const firstIsInvalid = data[firstItem.accessorKey] === false;
    const secondIsInvalid = data[secondItem.accessorKey] === false;

    return Number(firstIsInvalid) - Number(secondIsInvalid);
  });

  return [sortedColumns.slice(0, 5), sortedColumns.slice(5)];
};
</script>

<template>
  <div>
    <PageHeader title="Bakım kayıtları">
      <IconField>
        <InputIcon class="ri-search-line" />
        <InputText v-model="yscNoSearch" placeholder="Search" size="small" />
      </IconField>
      <!-- <IconField>
        <InputIcon class="ri-search-line" />
        <InputText
          v-model="yscNoSearch"
          size="small"
          placeholder="YSC no ara"
          class="w-full"
        />
        <InputIcon
          v-if="yscNoSearch"
          class="ri-close-line cursor-pointer"
          @click="yscNoSearch = ''"
        />
      </IconField> -->
      <Button
        :outlined="!hasActiveFilters"
        size="small"
        class="ml-auto"
        @click="showFilters = true"
      >
        <i class="ri-filter-3-line text-base" />
        <span>Filtreler</span>
        <span
          v-if="activeFilterCount"
          class="ml-2 min-w-5 h-5 px-1 inline-flex items-center justify-center rounded-full text-xs font-medium app-badge-muted"
        >
          {{ activeFilterCount }}
        </span>
      </Button>
      <Button
        v-if="hasActiveFilters"
        label="Temizle"
        icon="ri-close-line"
        size="small"
        severity="secondary"
        outlined
        @click="clearFilters"
      />
    </PageHeader>

    <Drawer
      v-model:visible="showFilters"
      header="Filtreler"
      position="right"
      :style="{ width: '22rem' }"
    >
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-2">
          <label class="app-label">Kontrol tarihi</label>
          <Select
            v-model="filters.dateMode"
            :options="dateModeOptions"
            optionLabel="label"
            optionValue="value"
          />
        </div>
        <div v-if="filters.dateMode !== 'none'" class="flex flex-col gap-2">
          <label class="app-label">Tarih</label>
          <DatePicker
            v-model="filters.date"
            :view="filters.dateMode === 'monthly' ? 'month' : 'date'"
            :date-format="filters.dateMode === 'monthly' ? 'mm/yy' : 'dd/mm/yy'"
            size="small"
            show-button-bar
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="app-label">Bulduğu bina/alan</label>
          <Select
            v-model="filters.building"
            :options="filterOptions.buildings"
            placeholder="Bina/alan seç"
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="app-label">Agirlik</label>
          <Select
            v-model="filters.weight"
            :options="filterOptions.units"
            placeholder="Agirlik seç"
            filter
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="app-label">Modeli/tipi</label>
          <Select
            v-model="filters.modelType"
            :options="filterOptions.modelTypes"
            placeholder="Modeli/tipi seç"
            filter
            show-clear
          />
        </div>
        <div class="flex flex-col gap-2">
          <label class="app-label">Sonuç</label>
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
      <div class="mt-6 flex items-center justify-end gap-2">
        <Button
          label="Temizle"
          severity="secondary"
          outlined
          @click="clearFilters"
        />
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
        :row-class="(rowData) => (rowData.result ? '' : 'app-row-danger')"
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
            <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
              <div
                class="grid gap-3 rounded-md border app-border-subtle bg-surface-0 p-3 md:grid-cols-2 dark:bg-surface-900"
              >
                <div
                  v-for="(group, groupIndex) in getExpandedInfoGroups(slotProps.data)"
                  :key="groupIndex"
                  class="flex min-w-0 flex-col gap-2 px-4"
                >
                  <div
                    v-for="item in group"
                    :key="item.accessorKey"
                    class="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-3 py-2"
                    :class="
                      slotProps.data[item.accessorKey] === false
                        ? 'bg-red-50'
                        : 'bg-transparent'
                    "
                  >
                    <span class="min-w-0 text-sm font-medium app-text-muted">
                      {{ item.header }}
                    </span>
                    <span class="app-text">
                      <CustomCell
                        v-if="isCellCustom(item.accessorKey)"
                        :field="item.accessorKey"
                        :value="slotProps.data[item.accessorKey]"
                      />
                      <span v-else>
                        {{ slotProps.data[item.accessorKey] ?? "-" }}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <aside class="flex flex-col gap-4">
                <div
                  class="rounded-md border app-border-subtle bg-surface-0 p-3 dark:bg-surface-900"
                >
                  <div class="mb-2 text-sm font-medium app-text-muted">
                    {{ headerLabels.photo_url }}
                  </div>
                  <div class="flex min-h-32 items-center justify-center">
                    <CustomCell
                      v-if="slotProps.data.photo_url"
                      field="photo_url"
                      :value="slotProps.data.photo_url"
                    />
                    <span v-else class="text-sm app-text-muted">-</span>
                  </div>
                </div>

                <div
                  class="rounded-md border app-border-subtle bg-surface-0 p-3 dark:bg-surface-900"
                >
                  <div class="mb-2 text-sm font-medium app-text-muted">
                    {{ headerLabels.note }}
                  </div>
                  <p class="whitespace-pre-wrap break-words text-sm app-text">
                    {{ slotProps.data.note || "-" }}
                  </p>
                </div>
              </aside>
            </div>
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>
