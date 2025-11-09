<script setup lang="ts">
import { headerLabels } from "~/constants";

const tabledata = ref([]);
const expandedRows = ref([]);
const { error } = await useFetch("/api/inspections", {
  method: "GET",
  onResponse({ response }) {
    if (response._data) {
      tabledata.value = response._data;
			console.log("Fetched data:", tabledata.value);
    } else {
      console.error("Error fetching data:", error);
    }
  },
});

const date = ref(new Date());

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
    <PageHeader title="2024 Nisan ayina ait kayitlar listeleniyor">
      <DatePicker
        v-model="date"
        view="month"
        date-format="mm/yy"
        size="small"
      />
    </PageHeader>
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
