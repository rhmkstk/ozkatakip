<script setup lang="ts">
defineProps<{ isActive: boolean }>();

const emit = defineEmits<{
	'update:isActive': [value: boolean];
	'openChangeDialog': [];
}>();

const closeDialog = () => emit('update:isActive', false);
const startChange = () => {
	closeDialog();
	emit('openChangeDialog');
};
</script>

<template>
	<Dialog
		:visible="isActive"
		:show-header="false"
		modal
		class="mobile-dialog"
		:style="{ width: 'min(25rem, calc(100vw - 2rem))' }"
		@update:visible="closeDialog"
	>
		<div class="pt-2">
			<div class="flex items-start gap-3">
				<span class="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">
					<i class="ri-check-line" />
				</span>
				<div>
					<p class="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
						Bakım kaydedildi
					</p>
					<h2 class="mt-1 text-lg font-bold leading-6 text-slate-950">
						YSC değişimi gerekiyor
					</h2>
				</div>
			</div>

			<div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
				<div class="flex items-start gap-3">
					<i class="ri-error-warning-line mt-0.5 text-xl text-amber-600" />
					<div>
						<p class="text-sm font-semibold text-amber-900">
							Kullanıma uygun değil
						</p>
						<p class="mt-1 text-sm leading-5 text-amber-800/80">
							Kontrol sonucu başarısız olduğu için bu YSC'nin yenisiyle değiştirilmesi gerekiyor.
						</p>
					</div>
				</div>
			</div>

			<div class="mt-6 space-y-2">
				<Button
					label="Değişim kaydı oluştur"
					icon="ri-swap-line"
					class="w-full"
					size="large"
					@click="startChange"
				/>
				<Button
					label="Daha sonra"
					severity="secondary"
					text
					class="w-full"
					@click="closeDialog"
				/>
			</div>
		</div>
	</Dialog>
</template>
