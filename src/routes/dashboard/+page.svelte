<script lang="ts">
  /**
   * @file src/routes/dashboard/+page.svelte
   * @description Siparişlerin takip edildiği onaylandığı/iptal edildiği, teslim işlemlerinin yapıldığı panel.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { WS_URL } from "$lib/api/constants";
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

  function formatOrderDate(dateStr: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  onMount(async () => {
    const token = localStorage.getItem("token"); // Token'ı al
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

    // Token'ı URL'e "?token=" formatında ekledik
    ws = new WebSocket(`${WS_URL}?token=${token}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_ORDER") {
        const newOrder = {
          id: data.order_id,
          full_name: data.full_name || "📱 Yeni Sipariş",
          total_price: data.total,
          status: "pending",
          note: data.note || "",
          created_at: data.created_at || new Date().toISOString(),
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
    if (!confirm("Sipariş iptal edilsin mi?")) return;
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
      {#each [{ title: "📥 Yeni Gelenler", list: pendingOrders, color: "blue", type: "pending" }, { title: "🍳 Hazırlananlar", list: approvedOrders, color: "yellow", type: "approved" }, { title: "🛍️ Teslim Bekleyenler", list: readyOrders, color: "green", type: "ready" }] as column}
        <div
          class="bg-gray-50 rounded-xl p-4 border border-gray-200 h-[calc(100vh-12rem)] overflow-y-auto"
        >
          <div
            class="flex justify-between items-center mb-4 sticky top-0 bg-gray-50 pb-2 z-10 border-b border-gray-200"
          >
            <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span
                class="bg-{column.color}-100 text-{column.color}-700 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                >{column.list.length}</span
              >
              {column.title}
            </h2>
          </div>
          <div class="space-y-4">
            {#each column.list as order}
              <div
                class="bg-white rounded-lg shadow-sm border-l-4 border-{column.color}-500 p-4 animate-in fade-in zoom-in-95"
              >
                <div class="flex justify-between items-start mb-2">
                  <div class="flex flex-col">
                    <span class="font-bold text-gray-900"
                      >{order.full_name}</span
                    >
                    <div class="flex flex-wrap gap-2 mt-1">
                      <span
                        class="text-[10px] font-black uppercase text-{column.color}-600 bg-{column.color}-50 px-1.5 py-0.5 rounded"
                        >👤 Öğrenci</span
                      >
                      <span class="text-[10px] font-bold text-gray-400"
                        >🕒 {formatOrderDate(order.created_at)}</span
                      >
                    </div>
                  </div>
                  <span class="text-lg font-bold text-gray-700"
                    >₺{order.total_price}</span
                  >
                </div>
                {#if order.note && order.note.trim() !== ""}
                  <div
                    class="mb-3 bg-yellow-50 border-l-4 border-yellow-400 p-2 rounded-r-md text-xs text-yellow-800"
                  >
                    <strong>Not:</strong>
                    {order.note}
                  </div>
                {/if}
                <div class="mt-4">
                  {#if column.type === "pending"}
                    <div class="flex gap-2">
                      <button
                        onclick={() => handleApprove(order.id)}
                        class="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-bold hover:bg-blue-700"
                        >Onayla</button
                      >
                      <button
                        onclick={() => handleReject(order.id)}
                        class="flex-1 bg-red-100 text-red-700 py-2 rounded-md text-sm font-bold hover:bg-red-200"
                        >İptal</button
                      >
                    </div>
                  {:else if column.type === "approved"}
                    <button
                      onclick={() => handleMakeReady(order.id)}
                      class="w-full bg-yellow-500 text-white py-2.5 rounded-md text-sm font-bold hover:bg-yellow-600"
                      >Hazır (Çağır)</button
                    >
                  {:else}
                    <button
                      onclick={() => handleComplete(order)}
                      class="w-full bg-green-600 text-white py-2.5 rounded-md text-sm font-bold hover:bg-green-700"
                      >Teslim Edildi</button
                    >
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>
