<script lang="ts">
  /**
   * @file src/routes/dashboard/menu/+page.svelte
   * @description Menü Yönetimi: Ürün ekleme, stok güncelleme ve kategori işlemlerinin yapıldığı arayüz.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import {
    getMaterials,
    addMaterial,
    addProduct,
    deleteMaterial,
    getProducts,
    deleteProduct,
    getProductRecipe,
    updateProduct,
  } from "$lib/api/menu";

  // --- STATE'LER (RUNES) ---
  let materials = $state<any[]>([]);
  let products = $state<any[]>([]);
  let isLoading = $state(true);
  let activeTab = $state("materials"); // materials | add_product | menu

  // --- PAGINATION AYARLARI ---
  const itemsPerPage = 6;
  let currentProductPage = $state(1);
  let currentMaterialPage = $state(1);

  // --- DETAY MODALI ---
  let showDetailsModal = $state(false);
  let detailProductName = $state("");
  let missingMaterialsList = $state<any[]>([]);
  let isDetailsLoading = $state(false);

  // Malzeme Formu & Filtreleme
  let newMatName = $state("");
  let newMatStock = $state(0);
  let newMatUnit = $state("Adet"); // Birim state'i burada hazır [cite: 1223]
  let isMatLoading = $state(false);
  let showSuggestions = $state(false);
  let materialSearchQuery = $state("");

  // MALZEME PAGINATION MANTIĞI [cite: 1225, 1226, 1227]
  let filteredMaterialsForTable = $derived(
    materials.filter((m) =>
      m.name
        .toLocaleLowerCase("tr-TR")
        .includes(materialSearchQuery.toLocaleLowerCase("tr-TR")),
    ),
  );
  let paginatedMaterials = $derived(
    filteredMaterialsForTable.slice(
      (currentMaterialPage - 1) * itemsPerPage,
      currentMaterialPage * itemsPerPage,
    ),
  );
  let totalMatPages = $derived(
    Math.ceil(filteredMaterialsForTable.length / itemsPerPage),
  );

  let suggestions = $derived(
    newMatName.trim().length > 0
      ? materials.filter(
          (m) =>
            m.name
              .toLocaleLowerCase("tr-TR")
              .includes(newMatName.toLocaleLowerCase("tr-TR")) &&
            m.name.toLocaleLowerCase("tr-TR") !==
              newMatName.toLocaleLowerCase("tr-TR"),
        )
      : [],
  );

  // Ürün Ekle Formu [cite: 1230, 1231]
  let newProdName = $state("");
  let newProdPrice = $state(0);
  let newProdCategory = $state("Atıştırmalık");
  let recipeItems = $state<{ material_id: string; quantity_needed: number }[]>(
    [],
  );
  let isProdLoading = $state(false);

  // GÜNCELLEME MODALI [cite: 1232, 1233]
  let showUpdateModal = $state(false);
  let updateProdId = $state("");
  let updateProdName = $state("");
  let updateProdPrice = $state(0);
  let updateProdCategory = $state("Atıştırmalık");
  let updateRecipeItems = $state<
    { material_id: string; quantity_needed: number }[]
  >([]);
  let isUpdateLoading = $state(false);

  // ÜRÜN (MENÜ) PAGINATION MANTIĞI [cite: 1234, 1235, 1236, 1237]
  let selectedCategoryFilter = $state("Tümü");
  let filteredProducts = $derived(
    selectedCategoryFilter === "Tümü"
      ? products
      : products.filter((p) => p.category === selectedCategoryFilter),
  );
  let paginatedProducts = $derived(
    filteredProducts.slice(
      (currentProductPage - 1) * itemsPerPage,
      currentProductPage * itemsPerPage,
    ),
  );
  let totalProdPages = $derived(
    Math.ceil(filteredProducts.length / itemsPerPage),
  );

  // Filtreler değişince sayfaları 1'e çek [cite: 1238, 1239]
  $effect(() => {
    selectedCategoryFilter;
    currentProductPage = 1;
  });
  $effect(() => {
    materialSearchQuery;
    currentMaterialPage = 1;
  });

  onMount(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      goto("/login");
      return;
    }
    await Promise.all([fetchMaterials(), fetchProducts()]);
    isLoading = false;
  });

  async function fetchMaterials() {
    try {
      materials = await getMaterials();
    } catch (error) {
      console.error("Malzeme yükleme hatası:", error);
    }
  }

  async function fetchProducts() {
    try {
      products = await getProducts();
    } catch (error) {
      console.error("Ürün yükleme hatası:", error);
    }
  }

  async function handleShowDetails(prod: any) {
    detailProductName = prod.name;
    isDetailsLoading = true;
    try {
      const recipe = await getProductRecipe(prod.id);
      missingMaterialsList = recipe
        .map((r: any) => {
          const mat = materials.find((m) => m.id === r.material_id);
          return {
            name: mat?.name || "Bilinmeyen Malzeme",
            needed: r.quantity_needed,
            current: mat?.stock_quantity || 0,
            unit: mat?.unit || "",
            isMissing: (mat?.stock_quantity || 0) < r.quantity_needed,
          };
        })
        .filter((m: any) => m.isMissing);
      showDetailsModal = true;
    } catch (error: any) {
      alert("Detaylar alınamadı: " + error.message);
    } finally {
      isDetailsLoading = false;
    }
  }

  async function handleAddMaterial(e: Event) {
    e.preventDefault();
    isMatLoading = true;
    const cleanName = toTitleCase(newMatName.trim());
    try {
      await addMaterial({
        name: cleanName,
        stock_quantity: newMatStock,
        unit: newMatUnit, // Birim burada API'ye gönderiliyor [cite: 1252]
      });
      newMatName = "";
      newMatStock = 0;
      newMatUnit = "Adet";
      await fetchMaterials();
      await fetchProducts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      isMatLoading = false;
    }
  }

  async function handleDeleteMaterial(id: string, name: string) {
    if (!confirm(`"${name}" malzemesini silmek istediğinize emin misiniz?`))
      return;
    try {
      await deleteMaterial(id);
      materials = materials.filter((m) => m.id !== id);
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleAddProduct(e: Event) {
    e.preventDefault();
    if (recipeItems.length === 0) {
      alert("En az 1 malzeme eklemelisiniz!");
      return;
    }
    isProdLoading = true;
    try {
      await addProduct({
        name: toTitleCase(newProdName.trim()),
        price: newProdPrice,
        category: newProdCategory,
        materials: recipeItems,
      });
      newProdName = "";
      newProdPrice = 0;
      recipeItems = [];
      await fetchProducts();
      activeTab = "menu";
    } catch (error: any) {
      alert(error.message);
    } finally {
      isProdLoading = false;
    }
  }

  async function handleDeleteProduct(id: string, name: string) {
    if (!confirm(`"${name}" adlı ürünü silmek istediğinize emin misiniz?`))
      return;
    try {
      await deleteProduct(id);
      products = products.filter((p) => p.id !== id);
    } catch (error: any) {
      alert(error.message);
    }
  }

  function addRecipeRow() {
    if (materials.length > 0)
      recipeItems = [
        ...recipeItems,
        { material_id: materials[0].id, quantity_needed: 1 },
      ];
    else alert("Önce depoya malzeme ekleyin!");
  }

  function removeRecipeRow(index: number) {
    recipeItems = recipeItems.filter((_, i) => i !== index);
  }

  async function openUpdateModal(prod: any) {
    updateProdId = prod.id;
    updateProdName = prod.name;
    updateProdPrice = prod.price;
    updateProdCategory = prod.category || "Atıştırmalık";
    try {
      updateRecipeItems = await getProductRecipe(prod.id);
      showUpdateModal = true;
    } catch (error: any) {
      alert(error.message);
    }
  }

  async function handleUpdateProduct(e: Event) {
    e.preventDefault();
    isUpdateLoading = true;
    try {
      await updateProduct(updateProdId, {
        name: toTitleCase(updateProdName.trim()),
        price: updateProdPrice,
        category: updateProdCategory,
        materials: updateRecipeItems,
      });
      showUpdateModal = false;
      await fetchProducts();
    } catch (error: any) {
      alert(error.message);
    } finally {
      isUpdateLoading = false;
    }
  }

  function toTitleCase(str: string) {
    return str
      .split(" ")
      .map(
        (w) =>
          w.charAt(0).toLocaleUpperCase("tr-TR") +
          w.slice(1).toLocaleLowerCase("tr-TR"),
      )
      .join(" ");
  }
</script>

/** * @file src/routes/dashboard/menu/+page.svelte * @description Menü Yönetimi:
Ürün ekleme, stok güncelleme ve kategori işlemlerinin yapıldığı arayüz. *
@author Onur Zaim * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
*/

{#if showDetailsModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
    >
      <div
        class="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center"
      >
        <h3 class="text-lg font-bold text-orange-900">Eksik Malzemeler</h3>
        <button
          onclick={() => (showDetailsModal = false)}
          class="text-orange-400 hover:text-orange-600"
          aria-label="Kapat"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
        <p class="text-sm text-gray-600 mb-4">
          <strong>{detailProductName}</strong> için şunlar lazım:
        </p>
        <div class="space-y-2">
          {#each missingMaterialsList as item}
            <div class="flex justify-between p-3 bg-red-50 rounded-lg">
              <span class="font-medium text-red-900">{item.name}</span>
              <span class="text-xs text-red-700"
                >Depo: {item.current} / Gereken: {item.needed} {item.unit}</span
              >
            </div>
          {/each}
        </div>
      </div>
      <div class="bg-gray-50 px-6 py-4 text-right">
        <button
          onclick={() => (showDetailsModal = false)}
          class="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium"
          >Anladım</button
        >
      </div>
    </div>
  </div>
{/if}

{#if showUpdateModal}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-md px-4"
  >
    <div
      class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
    >
      <div
        class="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center"
      >
        <h3 class="text-lg font-bold text-gray-900">Ürünü Düzenle</h3>
        <button
          onclick={() => (showUpdateModal = false)}
          class="text-gray-400 hover:text-gray-600"
          aria-label="Kapat"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            ><path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            /></svg
          >
        </button>
      </div>
      <form
        onsubmit={handleUpdateProduct}
        class="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
      >
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2 sm:col-span-1">
            <label for="updName" class="block text-sm font-medium text-gray-700"
              >Ürün Adı</label
            >
            <input
              id="updName"
              type="text"
              required
              bind:value={updateProdName}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
          </div>
          <div class="col-span-2 sm:col-span-1">
            <label
              for="updPrice"
              class="block text-sm font-medium text-gray-700">Fiyat</label
            >
            <input
              id="updPrice"
              type="number"
              step="0.5"
              required
              bind:value={updateProdPrice}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isUpdateLoading}
          class="w-full bg-blue-600 text-white py-3 rounded-md font-bold disabled:bg-blue-300"
        >
          {isUpdateLoading ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
        </button>
      </form>
    </div>
  </div>
{/if}

<div class="bg-white border-b border-gray-200">
  <div class="max-w-4xl mx-auto px-4">
    <nav class="-mb-px flex space-x-8">
      <button
        onclick={() => (activeTab = "materials")}
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
        'materials'
          ? 'border-blue-500 text-blue-600'
          : 'border-transparent text-gray-500'}">📦 Depo & Stok</button
      >
      <button
        onclick={() => (activeTab = "add_product")}
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab ===
        'add_product'
          ? 'border-green-500 text-green-600'
          : 'border-transparent text-gray-500'}">➕ Ürün Ekle</button
      >
      <button
        onclick={() => (activeTab = "menu")}
        class="py-4 px-1 border-b-2 font-medium text-sm {activeTab === 'menu'
          ? 'border-purple-500 text-purple-600'
          : 'border-transparent text-gray-500'}">📋 Menü Listesi</button
      >
    </nav>
  </div>
</div>

<main class="max-w-4xl w-full mx-auto py-8 px-4">
  {#if activeTab === "materials"}
    <div class="space-y-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">
          Malzeme Tanımla / Stok Güncelle
        </h2>
        <form
          onsubmit={handleAddMaterial}
          class="grid grid-cols-1 sm:grid-cols-5 gap-4"
        >
          <div class="sm:col-span-2 relative">
            <label for="matName" class="block text-sm font-medium text-gray-700"
              >Malzeme Adı</label
            >
            <input
              id="matName"
              type="text"
              required
              bind:value={newMatName}
              onfocus={() => (showSuggestions = true)}
              onblur={() => setTimeout(() => (showSuggestions = false), 200)}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
            {#if showSuggestions && suggestions.length > 0}
              <ul
                class="absolute z-10 w-full bg-white shadow-lg rounded-md border py-1 mt-1"
              >
                {#each suggestions as s}
                  <li>
                    <button
                      type="button"
                      class="w-full text-left px-3 py-2 hover:bg-blue-50"
                      onclick={() => {
                        newMatName = s.name;
                        newMatUnit = s.unit;
                      }}>{s.name}</button
                    >
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
          <div>
            <label
              for="matStock"
              class="block text-sm font-medium text-gray-700"
              >Stok Miktarı</label
            >
            <input
              id="matStock"
              type="number"
              step="0.1"
              required
              bind:value={newMatStock}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
          </div>
          <div>
            <label for="matUnit" class="block text-sm font-medium text-gray-700"
              >Birim</label
            >
            <select
              id="matUnit"
              bind:value={newMatUnit}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm bg-white"
            >
              <option value="Adet">Adet</option>
              <option value="Dilim">Dilim</option>
              <option value="Gram">Gram</option>
              <option value="Kilo">Kilo</option>
              <option value="Litre">Litre</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              disabled={isMatLoading}
              class="w-full bg-blue-600 text-white py-2 rounded-md font-medium text-sm"
              >Kaydet</button
            >
          </div>
        </form>
      </div>

      <div
        class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
      >
        <div class="p-4 border-b flex justify-between items-center bg-gray-50">
          <h3 class="font-bold text-gray-800">Mevcut Stok Durumu</h3>
          <input
            type="text"
            placeholder="Malzeme ara..."
            bind:value={materialSearchQuery}
            class="text-sm rounded-md border-gray-300 py-1"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase"
                  >Malzeme</th
                >
                <th
                  class="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase"
                  >Stok</th
                >
                <th
                  class="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase"
                  >İşlem</th
                >
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              {#each paginatedMaterials as m}
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 text-sm font-medium text-gray-900"
                    >{m.name}</td
                  >
                  <td
                    class="px-6 py-4 text-sm {m.stock_quantity <= 5
                      ? 'text-red-600 font-bold'
                      : 'text-gray-600'}"
                  >
                    {m.stock_quantity}
                    {m.unit}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <button
                      onclick={() => {
                        newMatName = m.name;
                        newMatUnit = m.unit;
                        newMatStock = m.stock_quantity;
                      }}
                      class="text-blue-600 hover:text-blue-900 mr-3"
                      title="Düzenle">Düzenle</button
                    >
                    <button
                      onclick={() => handleDeleteMaterial(m.id, m.name)}
                      class="text-red-600 hover:text-red-900"
                      title="Sil">Sil</button
                    >
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if totalMatPages > 1}
          <div
            class="p-4 bg-gray-50 border-t flex justify-center items-center gap-4"
          >
            <button
              disabled={currentMaterialPage === 1}
              onclick={() => currentMaterialPage--}
              class="px-4 py-1.5 bg-white border rounded-lg text-xs font-bold disabled:opacity-30"
              aria-label="Önceki Malzeme Sayfası">← Geri</button
            >
            <span class="text-xs font-bold text-gray-500"
              >{currentMaterialPage} / {totalMatPages}</span
            >
            <button
              disabled={currentMaterialPage === totalMatPages}
              onclick={() => currentMaterialPage++}
              class="px-4 py-1.5 bg-white border rounded-lg text-xs font-bold disabled:opacity-30"
              aria-label="Sonraki Malzeme Sayfası">İleri →</button
            >
          </div>
        {/if}
      </div>
    </div>
  {:else if activeTab === "add_product"}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-6">Yeni Ürün Ekle</h2>
      <form onsubmit={handleAddProduct} class="space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label for="pName" class="block text-sm font-medium text-gray-700"
              >Ürün Adı</label
            >
            <input
              id="pName"
              type="text"
              required
              bind:value={newProdName}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
          </div>
          <div>
            <label for="pPrice" class="block text-sm font-medium text-gray-700"
              >Satış Fiyatı (TL)</label
            >
            <input
              id="pPrice"
              type="number"
              step="0.5"
              required
              bind:value={newProdPrice}
              class="mt-1 block w-full rounded-md border-gray-300 sm:text-sm"
            />
          </div>
        </div>
        <div class="border-t pt-4">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-bold text-gray-600"
              >Reçete (Gereken Malzemeler)</span
            >
            <button
              type="button"
              onclick={addRecipeRow}
              class="text-xs bg-gray-100 px-3 py-1.5 rounded-md hover:bg-gray-200 font-bold"
              >+ Malzeme Ekle</button
            >
          </div>
          {#each recipeItems as item, index}
            <div class="flex gap-2 mb-3">
              <select
                bind:value={item.material_id}
                class="flex-1 rounded-md border-gray-300 text-sm"
              >
                {#each materials as m}<option value={m.id}>{m.name}</option
                  >{/each}
              </select>
              <input
                type="number"
                step="0.1"
                bind:value={item.quantity_needed}
                class="w-24 rounded-md border-gray-300 text-sm"
                placeholder="Miktar"
              />
              <button
                type="button"
                onclick={() => removeRecipeRow(index)}
                class="text-red-500 p-2"
                aria-label="Malzemeyi Reçeteden Kaldır">✕</button
              >
            </div>
          {/each}
        </div>
        <button
          type="submit"
          disabled={isProdLoading}
          class="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg shadow-md hover:bg-green-700"
        >
          {isProdLoading ? "Kaydediliyor..." : "Ürünü Menüye Ekle"}
        </button>
      </form>
    </div>
  {:else if activeTab === "menu"}
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div
        class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4"
      >
        <h2 class="text-xl font-bold text-gray-900">Menü & Satış Paneli</h2>
        <div class="flex gap-2 bg-gray-100 p-1 rounded-lg">
          {#each ["Tümü", "Yemek", "İçecek"] as cat}
            <button
              onclick={() => (selectedCategoryFilter = cat)}
              class="px-4 py-1.5 rounded-md text-sm font-medium transition-all {selectedCategoryFilter ===
              cat
                ? 'bg-white text-purple-700 shadow-sm'
                : 'text-gray-500'}">{cat}</button
            >
          {/each}
        </div>
      </div>
      {#if isLoading}
        <div class="text-center py-10">Yükleniyor...</div>
      {:else}
        <ul class="space-y-3">
          {#each paginatedProducts as prod}
            <li
              class="flex items-center justify-between p-4 rounded-xl border {prod.in_stock
                ? 'bg-white border-gray-100 hover:shadow-md'
                : 'bg-orange-50 border-orange-200'} transition-all"
            >
              <div class="flex flex-col">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-800">{prod.name}</span>
                  {#if !prod.in_stock}
                    <span
                      class="bg-orange-600 text-white text-[10px] font-black px-2 py-0.5 rounded"
                      >STOK YOK</span
                    >
                  {/if}
                </div>
                <span class="text-xs text-gray-400 font-bold uppercase"
                  >{prod.category}</span
                >
              </div>
              <div class="flex items-center gap-3">
                <span class="font-bold text-green-700">₺{prod.price}</span>
                {#if !prod.in_stock}
                  <button
                    onclick={() => handleShowDetails(prod)}
                    class="text-xs bg-orange-100 text-orange-700 px-3 py-1.5 rounded-md font-bold hover:bg-orange-200"
                    >Detaylar</button
                  >
                {/if}
                <button
                  onclick={() => openUpdateModal(prod)}
                  class="p-2 text-blue-500 hover:bg-blue-50 rounded-md"
                  aria-label="Ürünü Düzenle"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      stroke-width="2"
                    /></svg
                  >
                </button>
                <button
                  onclick={() => handleDeleteProduct(prod.id, prod.name)}
                  class="p-2 text-red-400 hover:bg-red-50 rounded-md"
                  aria-label="Ürünü Sil"
                >
                  <svg
                    class="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      stroke-width="2"
                    /></svg
                  >
                </button>
              </div>
            </li>
          {/each}
        </ul>
        {#if totalProdPages > 1}
          <div class="mt-8 flex justify-center items-center gap-4">
            <button
              disabled={currentProductPage === 1}
              onclick={() => currentProductPage--}
              class="px-4 py-2 bg-white border rounded-lg text-sm font-bold disabled:opacity-30"
              aria-label="Önceki Sayfa">← Geri</button
            >
            <span class="text-sm font-bold text-gray-500"
              >{currentProductPage} / {totalProdPages}</span
            >
            <button
              disabled={currentProductPage === totalProdPages}
              onclick={() => currentProductPage++}
              class="px-4 py-2 bg-white border rounded-lg text-sm font-bold disabled:opacity-30"
              aria-label="Sonraki Sayfa">İleri →</button
            >
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</main>
