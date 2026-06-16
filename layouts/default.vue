<script setup lang="ts">
const supabase = useSupabaseClient();
const { currentUser, loadCurrentUser } = useCurrentAppUser();
const { loadUserDirectory } = useUserDirectory();
const { toTenantPath } = useTenant();

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Logout error:", error.message);
  } else {
    await navigateTo("/login");
  }
  currentUser.value = null;
};

onMounted(async () => {
  await Promise.all([loadCurrentUser(true), loadUserDirectory(true)]);
});

const MENU_ITEMS = [
  { name: "Bakım kayıtları", path: "/", icon: "ri-booklet-line" },
  { name: "Dolum kayıtları", path: "/fill-records", icon: "ri-book-open-line" },
  { name: "İşlem geçmişi", path: "/history", icon: "ri-history-fill" },
  { name: "Planlama", path: "/planning", icon: "ri-calendar-todo-line" },
  { name: "YSC liste", path: "/products", icon: "ri-fire-line" },
  {
    name: "Kullanıcılar",
    path: "/users",
    icon: "ri-group-line",
    adminOnly: true,
  },
  { name: "Veri girişi", path: "/insert-data", icon: "ri-booklet-line" },
  { name: "Mobil", path: "/mobile", icon: "ri-cellphone-line" },
];

const filteredMenuItems = computed(() => {
  return MENU_ITEMS.filter(
    (item) => !item.adminOnly || currentUser.value?.role === "admin",
  ).map((item) => ({
    ...item,
    path: toTenantPath(item.path),
  }));
});
</script>
<template>
  <div class="flex w-full max-w-full h-screen gap-2 bg-[var(--p-surface-50)]">
    <div class="sidebar flex flex-col p-2 md:p-4">
      <img
        src="/assets/logo/provider-logo.jpeg"
        alt="provider logo"
        class="w-24 h-auto mx-auto mb-4 rounded-2xl"
      />
      <nav class="mt-12">
        <ul class="space-y-2">
          <li v-for="item in filteredMenuItems" :key="item.name">
            <NuxtLink
              :to="item.path"
              class="flex items-center px-4 py-2 gap-1.5 rounded-md text-[var(--p-text-color]) hover:bg-[var(--p-surface-100)]"
              active-class="bg-[var(--p-primary-color)] text-white"
            >
              <i :class="item.icon" class="text-lg" />
              <span>{{ item.name }}</span>
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="mt-auto">
        <!-- <div>Aktif Firma</div> -->
        <button
          @click="logout"
          class="flex items-center px-2 py-2 gap-1.5 rounded-md text-[var(--p-text-color]) hover:bg-[var(--p-surface-100)] w-full cursor-pointer"
        >
          <i class="ri-logout-circle-r-line text-lg" />
          <span>Çıkış yap</span>
        </button>
      </div>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div class="border-l app-border-subtle bg-white min-h-full">
        <slot />
      </div>
    </div>
  </div>
</template>
