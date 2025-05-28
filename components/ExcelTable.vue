<template>
	<div class="table-container">
		<!-- Add column visibility controls -->
		<div class="column-controls">
			<label
				v-for="column in table.getAllLeafColumns()"
				:key="column.id"
				class="column-toggle"
			>
				<input
					type="checkbox"
					:checked="column.getIsVisible()"
					@change="column.toggleVisibility()"
				>
				{{ column.columnDef.header }}
			</label>
		</div>

		<table class="excel-table">
			<thead>
				<tr>
					<th
						v-for="column in table.getVisibleLeafColumns()"
						:key="column.id"
					>
						{{ column.columnDef.header }}
					</th>
				</tr>
			</thead>
			<tbody>
				<tr
					v-for="row in table.getRowModel().rows"
					:key="row.id"
				>
					<td
						v-for="cell in row.getVisibleCells()"
						:key="cell.id"
					>
						{{ cell.getValue() }}
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</template>

<script setup>
import {
	useVueTable,
	getCoreRowModel,
} from '@tanstack/vue-table';
import { computed } from 'vue';

const props = defineProps({
	data: {
		type: Array,
		required: true,
	},
});

// Excel verisini düzenleyen fonksiyon
const processExcelData = (data) => {
	if (data.length < 2) return { headers: [], rows: [] };

	// İlk satırı (başlık) ve ikinci satırı (kolon isimleri) çıkar
	const [, headerRow, ...dataRows] = data;

	// Kolon isimlerini düzenle (__EMPTY_ prefix'ini kaldır)
	const headers = Object.entries(headerRow).map(([key, value]) => ({
		key: key,
		value: value,
	}));

	// Satırları düzenle
	const rows = dataRows.map((row) => {
		const newRow = {};
		headers.forEach((header) => {
			newRow[header.value] = row[header.key] || '';
		});
		return newRow;
	});

	return { headers, rows };
};

// İşlenmiş veriyi hesapla
const processedData = computed(() => processExcelData(props.data));

// Kolonları oluştur
const columns = computed(() => {
	if (!processedData.value.headers.length) return [];

	return processedData.value.headers.map(header => ({
		id: header.key,
		header: header.value,
		accessorKey: header.value,
	}));
});

// Tablo instance'ını oluştur
const table = useVueTable({
	get data() {
		return processedData.value.rows;
	},
	get columns() {
		return columns.value;
	},
	getCoreRowModel: getCoreRowModel(),
	enableColumnVisibility: true,
});
</script>

<style scoped>
.table-container {
  margin: 20px 0;
  overflow-x: auto;
}

.excel-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.excel-table th,
.excel-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: pre-line; /* \r\n karakterlerini yeni satır olarak göster */
}

.excel-table th {
  background-color: #f8f9fa;
  font-weight: 600;
}

.excel-table tr:hover {
  background-color: #f5f5f5;
}

.column-controls {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1rem;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.column-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.column-toggle input[type="checkbox"] {
  cursor: pointer;
}
</style>
