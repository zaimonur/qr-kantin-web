<script lang="ts">
  /**
   * @file src/routes/+page.svelte
   * @description Sipariş takipleri için ana panel.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { onMount, onDestroy } from "svelte";
  import { goto } from "$app/navigation";
  import {
    getActiveOrders,
    completeOrder,
    markOrderReady,
    approveOrder,
    rejectOrder,
  } from "$lib/api/orders";

  let orders = $state<any[]>([]);
  let isLoading = $state(true);
  let ws: WebSocket;

  let pendingOrders = $derived(orders.filter((o) => o.status === "pending"));
  let approvedOrders = $derived(orders.filter((o) => o.status === "approved"));
  let readyOrders = $derived(orders.filter((o) => o.status === "ready"));

  onMount(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      goto("/login");
      return;
    }

    try {
      orders = await getActiveOrders();
    } catch (error) {
      console.error("Siparişler çekilirken hata:", error);
    } finally {
      isLoading = false;
    }

    ws = new WebSocket("ws://localhost:1323/ws");
    ws.onopen = () => console.log("🟢 Kantinci Paneli Canlı Yayında!");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_ORDER") {
        const newOrder = {
          id: data.order_id,
          full_name: "📱 Yeni Mobil Sipariş",
          total_price: data.total,
          status: "pending",
          created_at: new Date().toISOString(),
          qr_token: data.qr_token,
        };
        orders = [newOrder, ...orders];
      }
    };
  });

  onDestroy(() => {
    if (ws) ws.close();
  });

  async function handleApprove(orderId: string) {
    try {
      await approveOrder(orderId);
      orders = orders.map((o) =>
        o.id === orderId ? { ...o, status: "approved" } : o,
      );
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  }

  async function handleReject(orderId: string) {
    if (
      !confirm(
        "Bu siparişi iptal edip ücretini iade etmek istediğinize emin misiniz?",
      )
    )
      return;
    try {
      await rejectOrder(orderId);
      orders = orders.filter((o) => o.id !== orderId);
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  }

  async function handleMakeReady(orderId: string) {
    try {
      await markOrderReady(orderId);
      orders = orders.map((o) =>
        o.id === orderId ? { ...o, status: "ready" } : o,
      );
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  }

  async function handleComplete(order: any) {
    if (!order.qr_token) {
      alert("QR okunamıyor, sayfayı yenileyin.");
      return;
    }
    try {
      await completeOrder(order.qr_token);
      orders = orders.filter((o) => o.id !== order.id);
    } catch (error: any) {
      alert("Hata: " + error.message);
    }
  }
</script>

<main class="flex-1 max-w-1600px w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
  {#if isLoading}
    <div class="flex justify-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>
  {:else}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start h-full">
      <div
        class="bg-gray-50 rounded-xl p-4 border border-gray-200 h-[calc(100vh-12rem)] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 pb-2 z-10 border-b border-gray-200"
        >
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span
              class="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              >{pendingOrders.length}</span
            >
            📥 Yeni Gelenler
          </h2>
        </div>
        <div class="space-y-4">
          {#if pendingOrders.length === 0}
            <p class="text-sm text-gray-500 text-center py-8">
              Bekleyen yeni sipariş yok.
            </p>
          {/if}
          {#each pendingOrders as order}
            <div
              class="bg-white rounded-lg shadow-sm border-l-4 border-blue-500 p-4 animate-in fade-in slide-in-from-left-2"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="font-bold text-gray-900">{order.full_name}</span>
                <span class="text-lg font-bold text-gray-700"
                  >₺{order.total_price}</span
                >
              </div>
              <div class="flex gap-2 mt-4">
                <button
                  onclick={() => handleApprove(order.id)}
                  class="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-bold hover:bg-blue-700 transition-colors"
                  >Onayla</button
                >
                <button
                  onclick={() => handleReject(order.id)}
                  class="flex-1 bg-red-100 text-red-700 py-2 rounded-md text-sm font-bold hover:bg-red-200 transition-colors"
                  >İptal (İade)</button
                >
              </div>
            </div>
          {/each}
        </div>
      </div>

      <div
        class="bg-gray-50 rounded-xl p-4 border border-gray-200 h-[calc(100vh-12rem)] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 pb-2 z-10 border-b border-gray-200"
        >
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span
              class="bg-yellow-100 text-yellow-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              >{approvedOrders.length}</span
            >
            🍳 Hazırlananlar
          </h2>
        </div>
        <div class="space-y-4">
          {#if approvedOrders.length === 0}
            <p class="text-sm text-gray-500 text-center py-8">
              Şu an hazırlanan sipariş yok.
            </p>
          {/if}
          {#each approvedOrders as order}
            <div
              class="bg-white rounded-lg shadow-sm border-l-4 border-yellow-500 p-4 animate-in fade-in zoom-in-95"
            >
              <div class="flex justify-between items-start mb-4">
                <span class="font-bold text-gray-900">{order.full_name}</span>
                <span class="text-lg font-bold text-gray-700"
                  >₺{order.total_price}</span
                >
              </div>
              <button
                onclick={() => handleMakeReady(order.id)}
                class="w-full flex justify-center items-center gap-2 bg-yellow-500 text-white py-2.5 rounded-md text-sm font-bold hover:bg-yellow-600 transition-colors shadow-sm"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path></svg
                >
                Hazır (Öğrenciyi Çağır)
              </button>
            </div>
          {/each}
        </div>
      </div>

      <div
        class="bg-gray-50 rounded-xl p-4 border border-gray-200 h-[calc(100vh-12rem)] overflow-y-auto"
      >
        <div
          class="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 pb-2 z-10 border-b border-gray-200"
        >
          <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span
              class="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
              >{readyOrders.length}</span
            >
            🛍️ Teslim Bekleyenler
          </h2>
        </div>
        <div class="space-y-4">
          {#if readyOrders.length === 0}
            <p class="text-sm text-gray-500 text-center py-8">
              Teslim bekleyen sipariş yok.
            </p>
          {/if}
          {#each readyOrders as order}
            <div
              class="bg-white rounded-lg shadow-sm border-l-4 border-green-500 p-4 animate-in fade-in slide-in-from-right-2"
            >
              <div class="flex justify-between items-start mb-4">
                <span class="font-bold text-gray-900">{order.full_name}</span>
                <span class="text-lg font-bold text-gray-700"
                  >₺{order.total_price}</span
                >
              </div>
              <button
                onclick={() => handleComplete(order)}
                class="w-full flex justify-center items-center gap-2 bg-green-600 text-white py-2.5 rounded-md text-sm font-bold hover:bg-green-700 transition-colors shadow-sm focus:ring-4 focus:ring-green-100"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M5 13l4 4L19 7"
                  ></path></svg
                >
                Teslim Edildi
              </button>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</main>
