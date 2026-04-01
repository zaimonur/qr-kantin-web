<script lang="ts">
  /**
   * @file src/routes/dashboard/reports/+page.svelte
   * @description Raporlama: Günlük/Aylık satış verilerinin ve stok hareketlerinin analiz edildiği görsel panel.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */
  import { onMount, tick } from "svelte";
  import { getSalesReport, getDetailedOrders } from "$lib/api/reports";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  let startDate = $state("");
  let endDate = $state("");
  let reportData = $state<any>(null);
  let isInitialLoad = $state(true);
  let activeFilter = $state("today");

  let hourlyChartCanvas = $state<HTMLCanvasElement | null>(null);
  let categoryChartCanvas = $state<HTMLCanvasElement | null>(null);

  let hourlyChart: Chart | null = null;
  let categoryChart: Chart | null = null;

  let detailedOrders = $state<any[]>([]);
  let searchQuery = $state("");

  let showCategoryModal = $state(false);
  let selectedCategoryTitle = $state("");
  let selectedCategoryDetails = $state<
    { product_name: string; quantity: number; revenue: number }[]
  >([]);

  let showOrderModal = $state(false);
  let selectedOrder = $state<any>(null);

  // YENİ: Arama çubuğu artık isim, ürün, e-mail ve statüye göre de çalışıyor!
  let filteredOrders = $derived(
    searchQuery.trim() === ""
      ? detailedOrders
      : detailedOrders.filter(
          (o) =>
            o.full_name
              .toLocaleLowerCase("tr-TR")
              .includes(searchQuery.toLocaleLowerCase("tr-TR")) ||
            o.items_detail
              .toLocaleLowerCase("tr-TR")
              .includes(searchQuery.toLocaleLowerCase("tr-TR")) ||
            (o.email &&
              o.email
                .toLocaleLowerCase("tr-TR")
                .includes(searchQuery.toLocaleLowerCase("tr-TR"))) ||
            (o.role &&
              o.role
                .toLocaleLowerCase("tr-TR")
                .includes(searchQuery.toLocaleLowerCase("tr-TR"))),
        ),
  );

  onMount(() => {
    setDateRange("today");
  });

  function getLocalDateString(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function setDateRange(range: "today" | "week" | "month") {
    activeFilter = range;
    const end = new Date();
    const start = new Date();

    if (range === "week") {
      start.setDate(end.getDate() - 7);
    } else if (range === "month") {
      start.setMonth(end.getMonth() - 1);
    }

    startDate = getLocalDateString(start);
    endDate = getLocalDateString(end);

    fetchReport();
  }

  function handleCustomDateChange() {
    activeFilter = "custom";
    fetchReport();
  }

  async function fetchReport() {
    if (!startDate || !endDate) return;
    try {
      const [reportRes, ordersRes] = await Promise.all([
        getSalesReport(startDate, endDate),
        getDetailedOrders(startDate, endDate),
      ]);

      reportData = reportRes;
      detailedOrders = ordersRes;
      isInitialLoad = false;

      await tick();
      renderCharts();
    } catch (error: any) {
      alert("Veriler çekilirken hata oluştu: " + error.message);
      isInitialLoad = false;
    }
  }

  function openCategoryModal(category: string) {
    selectedCategoryTitle = category;
    selectedCategoryDetails = reportData.product_sales.filter(
      (p: any) => p.category === category,
    );
    showCategoryModal = true;
  }

  function openOrderModal(order: any) {
    selectedOrder = order;
    showOrderModal = true;
  }

  function renderCharts() {
    if (!reportData) return;

    if (hourlyChart) hourlyChart.destroy();
    if (categoryChart) categoryChart.destroy();

    if (
      hourlyChartCanvas &&
      reportData.hourly_sales &&
      reportData.hourly_sales.length > 0
    ) {
      const labels = reportData.hourly_sales.map((s: any) => `${s.hour}:00`);
      const data = reportData.hourly_sales.map((s: any) => s.count);

      hourlyChart = new Chart(hourlyChartCanvas, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Sipariş Sayısı",
              data: data,
              backgroundColor: "rgba(59, 130, 246, 0.8)",
              borderRadius: 6,
              barPercentage: 0.6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } },
            x: { grid: { display: false } },
          },
        },
      });
    }

    if (
      categoryChartCanvas &&
      reportData.category_sales &&
      reportData.category_sales.length > 0
    ) {
      const labels = reportData.category_sales.map((c: any) => c.category);
      const data = reportData.category_sales.map((c: any) => c.total);

      const bgColors = labels.map((l: string) => {
        if (l === "İçecek") return "#3b82f6";
        if (l === "Yemek") return "#ef4444";
        if (l === "Atıştırmalık") return "#f97316";
        return "#8b5cf6";
      });

      categoryChart = new Chart(categoryChartCanvas, {
        type: "doughnut",
        data: {
          labels: labels,
          datasets: [
            {
              data: data,
              backgroundColor: bgColors,
              borderWidth: 0,
              hoverOffset: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "75%",
          plugins: {
            legend: {
              position: "bottom",
              labels: { padding: 20, usePointStyle: true },
            },
          },
          onClick: (event: any, elements: any, chart: any) => {
            if (elements && elements.length > 0) {
              const index = elements[0].index;
              const category = chart.data.labels[index];
              openCategoryModal(category);
            }
          },
        },
      });
    }
  }
</script>

{#if showCategoryModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4 transition-all"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <div
        class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"
      >
        <h3 class="text-lg font-bold text-gray-900">
          {selectedCategoryTitle} Satışları
        </h3>
        <button
          type="button"
          aria-label="Kapat"
          onclick={() => (showCategoryModal = false)}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg
          >
        </button>
      </div>
      <div class="p-0 max-h-[60vh] overflow-y-auto">
        {#if selectedCategoryDetails.length === 0}
          <div class="p-6 text-center text-gray-500">
            Bu kategoride detay bulunamadı.
          </div>
        {:else}
          <ul class="divide-y divide-gray-100">
            {#each selectedCategoryDetails as prod}
              <li
                class="p-5 hover:bg-gray-50 transition-colors flex justify-between items-center group"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="bg-blue-50 text-blue-600 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg"
                  >
                    {prod.quantity}
                  </div>
                  <div>
                    <p class="font-bold text-gray-800">{prod.product_name}</p>
                    <p class="text-xs text-gray-500 uppercase tracking-wide">
                      Adet Satıldı
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-bold text-green-600 text-lg">
                    ₺{prod.revenue.toFixed(2)}
                  </p>
                  <p class="text-xs text-gray-400">Ciro</p>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
      <div class="bg-gray-50 px-6 py-4 border-t border-gray-100 text-right">
        <button
          onclick={() => (showCategoryModal = false)}
          class="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors"
          >Kapat</button
        >
      </div>
    </div>
  </div>
{/if}

{#if showOrderModal && selectedOrder}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4 transition-all"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
    >
      <div
        class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"
      >
        <h3 class="text-lg font-bold text-gray-900">Sipariş Detayı</h3>
        <button
          type="button"
          aria-label="Kapat"
          onclick={() => (showOrderModal = false)}
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg
          >
        </button>
      </div>

      <div class="p-6">
        <div class="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div
            class="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl shadow-inner shrink-0"
          >
            {selectedOrder.full_name.charAt(0)}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-gray-900 text-lg">
                {selectedOrder.full_name}
              </h4>
              <span
                class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md {selectedOrder.role ===
                'ogretmen'
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600'}"
              >
                {selectedOrder.role === "ogretmen"
                  ? "Öğretmen"
                  : selectedOrder.role === "ogrenci"
                    ? "Öğrenci"
                    : selectedOrder.role}
              </span>
            </div>
            <p class="text-sm text-gray-500">{selectedOrder.email}</p>
            <p class="text-xs text-gray-400 mt-1">{selectedOrder.created_at}</p>
          </div>
        </div>

        <div class="mb-6 flex justify-between items-center">
          <span class="text-sm font-semibold text-gray-500 uppercase"
            >Sipariş Durumu</span
          >
          <span
            class="px-3 py-1.5 inline-flex text-sm font-bold rounded-full
            {selectedOrder.status === 'completed'
              ? 'bg-green-100 text-green-800'
              : selectedOrder.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-orange-100 text-orange-800'}"
          >
            {selectedOrder.status === "completed"
              ? "Teslim Edildi"
              : selectedOrder.status === "cancelled"
                ? "İptal Edildi"
                : "İşlemde"}
          </span>
        </div>

        <div>
          <span class="text-sm font-semibold text-gray-500 uppercase block mb-3"
            >Alınan Ürünler</span
          >
          <div class="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <ul class="space-y-2">
              {#each selectedOrder.items_detail.split(", ") as item}
                <li class="flex items-start">
                  <span class="text-green-500 mr-2">✓</span>
                  <span class="text-gray-800 font-medium">{item}</span>
                </li>
              {/each}
            </ul>
          </div>
        </div>
      </div>

      <div
        class="bg-gray-50 px-6 py-4 border-t border-gray-100 flex justify-between items-center"
      >
        <span class="text-sm font-bold text-gray-500 uppercase"
          >Toplam Tutar</span
        >
        <span class="text-2xl font-black text-green-600"
          >₺{selectedOrder.total_price.toFixed(2)}</span
        >
      </div>
    </div>
  </div>
{/if}

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div
    class="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6"
  >
    <div>
      <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">
        Satış Analizi
      </h1>
      <p class="text-sm text-gray-500 mt-1">
        Kantin performansınızı detaylı olarak inceleyin.
      </p>
    </div>

    <div
      class="flex flex-wrap items-center gap-4 bg-white p-2 rounded-xl shadow-sm border border-gray-100"
    >
      <div class="flex bg-gray-100 p-1 rounded-lg">
        <button
          onclick={() => setDateRange("today")}
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeFilter ===
          'today'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}">Bugün</button
        >
        <button
          onclick={() => setDateRange("week")}
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeFilter ===
          'week'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}">Bu Hafta</button
        >
        <button
          onclick={() => setDateRange("month")}
          class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors {activeFilter ===
          'month'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'}">Bu Ay</button
        >
      </div>
      <div class="w-px h-8 bg-gray-200 hidden sm:block"></div>
      <div class="flex items-center gap-2">
        <input
          type="date"
          bind:value={startDate}
          onchange={handleCustomDateChange}
          class="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <span class="text-gray-400">-</span>
        <input
          type="date"
          bind:value={endDate}
          onchange={handleCustomDateChange}
          class="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>

  {#if isInitialLoad}
    <div class="flex items-center justify-center h-64">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>
  {:else if reportData}
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
      >
        <div class="bg-green-50 p-4 rounded-xl text-green-600">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            /></svg
          >
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Toplam Ciro
          </p>
          <p class="text-3xl font-black text-gray-900 mt-1">
            ₺{reportData.total_revenue.toFixed(2)}
          </p>
        </div>
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
      >
        <div class="bg-blue-50 p-4 rounded-xl text-blue-600">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            /></svg
          >
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">
            Net Sipariş
          </p>
          <p class="text-3xl font-black text-gray-900 mt-1">
            {reportData.total_orders}
          </p>
        </div>
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow"
      >
        <div class="bg-red-50 p-4 rounded-xl text-red-500">
          <svg
            class="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            /></svg
          >
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">
            İptal Edilen
          </p>
          <p class="text-3xl font-black text-gray-900 mt-1">
            {reportData.cancelled_orders}
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div
        class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
      >
        <h3 class="text-lg font-bold text-gray-900 mb-1">
          Saatlik Sipariş Yoğunluğu
        </h3>
        <p class="text-sm text-gray-500 mb-6">
          Öğrencilerin kantini en çok kullandığı saat aralıkları
        </p>

        {#if reportData.hourly_sales && reportData.hourly_sales.length > 0}
          <div class="w-full h-72">
            <canvas bind:this={hourlyChartCanvas}></canvas>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center h-72 text-gray-400"
          >
            <svg
              class="w-16 h-16 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              /></svg
            >
            <p>Seçilen tarihlerde saatlik veri bulunamadı.</p>
          </div>
        {/if}
      </div>

      <div
        class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col group relative"
      >
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">
              Kategori Ciro Dağılımı
            </h3>
            <p class="text-sm text-gray-500 mb-6">
              Detaylar için grafiğe tıklayın 👆
            </p>
          </div>
        </div>

        {#if reportData.category_sales && reportData.category_sales.length > 0}
          <div class="w-full flex-1 min-h-250px relative cursor-pointer">
            <canvas bind:this={categoryChartCanvas}></canvas>
            <div
              class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-4"
            >
              <span
                class="text-xs font-semibold text-gray-400 uppercase tracking-widest"
                >Toplam</span
              >
              <span class="text-xl font-black text-gray-900 mt-1"
                >₺{reportData.total_revenue.toFixed(0)}</span
              >
            </div>
          </div>
        {:else}
          <div
            class="flex flex-col items-center justify-center flex-1 min-h-250px text-gray-400"
          >
            <svg
              class="w-16 h-16 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              /><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              /></svg
            >
            <p>Kategori verisi bulunamadı.</p>
          </div>
        {/if}
      </div>
    </div>

    <div class="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div>
          <h3 class="text-lg font-bold text-gray-900">
            Müşteri ve Sipariş Sorgulama
          </h3>
          <p class="text-sm text-gray-500">
            Detaylar için ilgili satıra tıklayın (İsim, Ürün, E-mail veya Statü
            arayın)
          </p>
        </div>

        <div class="relative w-full sm:w-80">
          <div
            class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
          >
            <svg
              class="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              /></svg
            >
          </div>
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="İsim, mail, statü veya ürün ara..."
            class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      <div class="overflow-x-auto rounded-lg border border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >Tarih / Saat</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >Müşteri Detayı</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >Ne Aldı?</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >Tutar</th
              >
              <th
                scope="col"
                class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider"
                >Durum</th
              >
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#if filteredOrders.length === 0}
              <tr>
                <td
                  colspan="5"
                  class="px-6 py-8 text-center text-sm text-gray-500"
                >
                  Aramanıza veya seçilen tarihe uygun sipariş bulunamadı.
                </td>
              </tr>
            {:else}
              {#each filteredOrders as order}
                <tr
                  class="hover:bg-blue-50 cursor-pointer transition-colors"
                  onclick={() => openOrderModal(order)}
                >
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    >{order.created_at}</td
                  >

                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div
                        class="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold mr-3 shrink-0"
                      >
                        {order.full_name.charAt(0)}
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium text-gray-900"
                            >{order.full_name}</span
                          >
                          <span
                            class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase"
                          >
                            {order.role === "ogretmen"
                              ? "Öğretmen"
                              : order.role === "ogrenci"
                                ? "Öğrenci"
                                : order.role}
                          </span>
                        </div>
                        <span class="text-xs text-gray-500">{order.email}</span>
                      </div>
                    </div>
                  </td>

                  <td
                    class="px-6 py-4 text-sm text-gray-700 max-w-xs truncate"
                    title={order.items_detail}
                  >
                    {order.items_detail}
                  </td>
                  <td
                    class="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600"
                  >
                    ₺{order.total_price.toFixed(2)}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span
                      class="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      {order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-orange-100 text-orange-800'}"
                    >
                      {order.status === "completed"
                        ? "Teslim Edildi"
                        : order.status === "cancelled"
                          ? "İptal"
                          : "İşlemde"}
                    </span>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
