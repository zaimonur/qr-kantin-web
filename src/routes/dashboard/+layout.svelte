<script lang="ts">
  /**
   * @file src/routes/dashboard/+layout.svelte
   * @description Navbar ve yönlendirmeleri ayarladığımız sayfa.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { page } from "$app/stores";
  import { logoutUser } from "$lib/api/auth";
  import { goto } from "$app/navigation";

  let { children } = $props();

  function handleLogout() {
    logoutUser();
    goto("/login");
  }
</script>

<div class="min-h-screen bg-gray-50 flex flex-col">
  <nav class="bg-white shadow-sm border-b border-gray-200 shrink-0">
    <div class="max-w-1400px mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center gap-6">
          <div class="shrink-0 flex items-center gap-2">
            <span class="text-2xl">🍔</span>
            <span class="font-bold text-xl text-gray-800">QR Kantin</span>
          </div>

          <div class="hidden md:flex space-x-1">
            <a
              href="/dashboard"
              class="{$page.url.pathname === '/dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >📝 Sipariş Akışı</a
            >
            <a
              href="/dashboard/menu"
              class="{$page.url.pathname === '/dashboard/menu'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >📦 Stok & Menü</a
            >
            <a
              href="/dashboard/reports"
              class="{$page.url.pathname === '/dashboard/reports'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >📊 Sipariş Rapoları</a
            >
            <a
              href="/dashboard/approvals"
              class="{($page.url.pathname as string) === '/dashboard/approvals'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >✅ Onay Merkezi</a
            >
            <a
              href="/dashboard/register"
              class="{($page.url.pathname as string) === '/dashboard/register'
                ? 'bg-purple-50 text-purple-700'
                : 'text-gray-500 hover:text-purple-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >👑 Yönetici Ekle</a
            >
            <a
              href="/dashboard/customers"
              class="{($page.url.pathname as string) === '/dashboard/customers'
                ? 'bg-blue-50 text-blue-700'
                : 'text-gray-500 hover:text-blue-600 hover:bg-gray-50'} px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >👥 Müşteri İşlemleri</a
            >
          </div>
        </div>

        <div class="flex items-center gap-4">
          {#if $page.url.pathname === "/dashboard"}
            <span class="relative flex h-3 w-3" title="Canlı Bağlantı Aktif">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-3 w-3 bg-green-500"
              ></span>
            </span>
          {/if}
          <button
            onclick={handleLogout}
            class="text-gray-500 hover:text-red-600 font-medium text-sm transition-colors"
            >Çıkış Yap</button
          >
        </div>
      </div>
    </div>
  </nav>

  {@render children()}
</div>
