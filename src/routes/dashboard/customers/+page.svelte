<script lang="ts">
  /**
   * @file src/routes/dashboard/customers/+page.svelte
   * @description Müşteri Yönetimi: Kayıtlı öğrenci bilgilerinin düzenlendiği ve bakiye geçmişinin incelendiği sayfa.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { onMount } from "svelte";
  import {
    getAllCustomers,
    adminLoadBalance,
    registerStudentByAdmin,
    registerTeacherByAdmin,
  } from "$lib/api/users";
  import { fade, fly } from "svelte/transition";

  // --- STATE'LER (RUNES) ---
  let activeTab = $state("load-balance");
  let customers = $state<any[]>([]);
  let searchQuery = $state("");
  let isLoading = $state(false);
  let message = $state({ text: "", type: "" });

  let selectedCustomer = $state<any>(null);
  let loadAmount = $state<number | null>(null);

  let newStudent = $state({ fullName: "", email: "", password: "" });
  let newTeacher = $state({ fullName: "", email: "", password: "" });

  onMount(async () => {
    await fetchCustomers();
  });

  async function fetchCustomers() {
    try {
      customers = await getAllCustomers();
    } catch (err: any) {
      console.error(err.message);
    }
  }

  let filteredCustomers = $derived(
    searchQuery.trim() === ""
      ? customers
      : customers.filter(
          (c) =>
            c.full_name
              .toLocaleLowerCase("tr-TR")
              .includes(searchQuery.toLocaleLowerCase("tr-TR")) ||
            c.email
              .toLocaleLowerCase("tr-TR")
              .includes(searchQuery.toLocaleLowerCase("tr-TR")),
        ),
  );

  async function handleLoadBalance() {
    if (!selectedCustomer || !loadAmount || loadAmount <= 0) return;
    isLoading = true;
    try {
      await adminLoadBalance(selectedCustomer.id, loadAmount);
      showNotification(
        `${selectedCustomer.full_name} hesabına ₺${loadAmount.toFixed(2)} yüklendi!`,
        "success",
      );
      loadAmount = null;
      selectedCustomer = null;
      await fetchCustomers();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      isLoading = false;
    }
  }

  async function handleRegister(type: "student" | "teacher") {
    const data = type === "student" ? newStudent : newTeacher;
    if (!data.fullName || !data.email || !data.password) {
      showNotification("Lütfen tüm alanları doldurun!", "error");
      return;
    }
    isLoading = true;
    try {
      if (type === "student") {
        await registerStudentByAdmin(data.fullName, data.email, data.password);
        newStudent = { fullName: "", email: "", password: "" };
      } else {
        await registerTeacherByAdmin(data.fullName, data.email, data.password);
        newTeacher = { fullName: "", email: "", password: "" };
      }
      showNotification(
        `${type === "student" ? "Öğrenci" : "Öğretmen"} başarıyla kaydedildi!`,
        "success",
      );
      await fetchCustomers();
    } catch (err: any) {
      showNotification(err.message, "error");
    } finally {
      isLoading = false;
    }
  }

  function showNotification(text: string, type: "success" | "error") {
    message = { text, type };
    setTimeout(() => (message = { text: "", type: "" }), 3000);
  }
</script>

<div
  class="max-w-7xl mx-auto p-6 h-[calc(100vh-90px)] flex flex-col overflow-hidden relative"
>
  <div class="mb-10 shrink-0">
    <h1 class="text-3xl font-black text-gray-900">Müşteri Yönetim Merkezi</h1>
    <p class="text-gray-500 mt-1">
      Bakiyeler ve kayıtlar için merkezi kontrol noktası.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1 min-h-0">
    <div
      class="md:col-span-3 space-y-2 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm h-fit shrink-0"
    >
      <button
        onclick={() => (activeTab = "load-balance")}
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all {activeTab ===
        'load-balance'
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-50'}">💰 Bakiye İşlemleri</button
      >
      <button
        onclick={() => (activeTab = "reg-student")}
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all {activeTab ===
        'reg-student'
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-50'}">🎓 Öğrenci Kayıt</button
      >
      <button
        onclick={() => (activeTab = "reg-teacher")}
        class="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all {activeTab ===
        'reg-teacher'
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-gray-600 hover:bg-gray-50'}">👨‍🏫 Öğretmen Kayıt</button
      >
    </div>

    <div class="md:col-span-9 h-full min-h-0 relative w-full overflow-hidden">
      {#if activeTab === "load-balance"}
        <div
          class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full min-h-0 overflow-hidden w-full max-w-4xl mx-auto relative z-10"
        >
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="İsim veya e-posta ile ara..."
            class="w-full mb-6 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 shrink-0"
          />

          <div class="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {#each filteredCustomers as customer}
              <button
                onclick={() => (selectedCustomer = customer)}
                class="w-full flex items-center justify-between p-4 rounded-xl border transition-all border-gray-50 hover:border-blue-200 bg-white"
              >
                <div class="flex items-center gap-3 text-left">
                  <div
                    class="w-10 h-10 rounded-full {customer.role === 'ogretmen'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-blue-100 text-blue-600'} flex items-center justify-center font-bold shrink-0"
                  >
                    {customer.full_name.charAt(0)}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <p class="font-bold text-gray-900 leading-tight">
                        {customer.full_name}
                      </p>
                      <span
                        class="px-1.5 py-0.5 text-[9px] font-black uppercase rounded {customer.role ===
                        'ogretmen'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-600'}"
                      >
                        {customer.role === "ogretmen" ? "Öğretmen" : "Öğrenci"}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm font-black text-blue-700">
                    ₺{customer.balance.toFixed(2)}
                  </p>
                </div>
              </button>
            {:else}
              <p class="text-center text-gray-400 py-10">Müşteri bulunamadı.</p>
            {/each}
          </div>
        </div>
      {:else if activeTab === "reg-student"}
        <div
          class="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar pb-10"
        >
          <div
            class="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto w-full h-fit"
          >
            <h2 class="text-2xl font-black mb-8">Yeni Öğrenci Kaydı</h2>
            <div class="space-y-6">
              <div>
                <label
                  for="s-name"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >AD SOYAD</label
                ><input
                  id="s-name"
                  type="text"
                  bind:value={newStudent.fullName}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="Onur Zaim"
                />
              </div>
              <div>
                <label
                  for="s-email"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >E-POSTA</label
                ><input
                  id="s-email"
                  type="email"
                  bind:value={newStudent.email}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="ogrenci@okul.com"
                />
              </div>
              <div>
                <label
                  for="s-pass"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >ŞİFRE</label
                ><input
                  id="s-pass"
                  type="password"
                  bind:value={newStudent.password}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="••••••••"
                />
              </div>
              <button
                onclick={() => handleRegister("student")}
                disabled={isLoading}
                class="w-full bg-black text-white font-black py-5 rounded-xl hover:bg-gray-800 transition-all"
                >KAYDET</button
              >
            </div>
          </div>
        </div>
      {:else if activeTab === "reg-teacher"}
        <div
          class="absolute inset-0 w-full h-full overflow-y-auto custom-scrollbar pb-10"
        >
          <div
            class="bg-white p-10 rounded-2xl border border-gray-100 shadow-sm max-w-2xl mx-auto w-full h-fit"
          >
            <h2 class="text-2xl font-black mb-8 text-purple-700">
              Yeni Öğretmen Kaydı
            </h2>
            <div class="space-y-6">
              <div>
                <label
                  for="t-name"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >AD SOYAD</label
                ><input
                  id="t-name"
                  type="text"
                  bind:value={newTeacher.fullName}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="Onur Hoca"
                />
              </div>
              <div>
                <label
                  for="t-email"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >E-POSTA</label
                ><input
                  id="t-email"
                  type="email"
                  bind:value={newTeacher.email}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="ogretmen@okul.com"
                />
              </div>
              <div>
                <label
                  for="t-pass"
                  class="block text-sm font-bold text-gray-700 mb-2"
                  >ŞİFRE</label
                ><input
                  id="t-pass"
                  type="password"
                  bind:value={newTeacher.password}
                  class="w-full p-4 bg-gray-50 border-none rounded-xl"
                  placeholder="••••••••"
                />
              </div>
              <button
                onclick={() => handleRegister("teacher")}
                disabled={isLoading}
                class="w-full bg-purple-600 text-white font-black py-5 rounded-xl hover:bg-purple-700 transition-all"
                >KAYDET</button
              >
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>

  {#if selectedCustomer}
    <div
      class="fixed inset-0 z-1000] flex items-center justify-center p-4 overflow-hidden"
      transition:fade
    >
      <button
        type="button"
        class="absolute inset-0 w-full h-full bg-black/50 backdrop-blur-sm cursor-default border-none outline-none"
        aria-label="Arka planı kapat"
        onclick={() => (selectedCustomer = null)}
      ></button>

      <div
        class="bg-white p-10 rounded-2xl border border-gray-100 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative z-10"
      >
        <button
          type="button"
          aria-label="Pop-up'ı Kapat"
          onclick={() => (selectedCustomer = null)}
          class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="2"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div class="text-center">
          <div
            class="w-24 h-24 rounded-full {selectedCustomer.role === 'ogretmen'
              ? 'bg-purple-600 shadow-purple-200'
              : 'bg-blue-600 shadow-blue-200'} text-white flex items-center justify-center text-4xl font-black mx-auto mb-6 shadow-lg"
          >
            {selectedCustomer.full_name.charAt(0)}
          </div>
          <h2 class="text-3xl font-black mb-2">{selectedCustomer.full_name}</h2>
          <p
            class="text-base font-bold {selectedCustomer.role === 'ogretmen'
              ? 'text-purple-600'
              : 'text-blue-600'} uppercase tracking-wider mb-2"
          >
            {selectedCustomer.role === "ogretmen" ? "Öğretmen" : "Öğrenci"}
          </p>
          <p class="text-gray-500 mb-8">{selectedCustomer.email}</p>

          <div class="bg-gray-50 p-6 rounded-xl text-left">
            <label
              for="cash"
              class="block text-xs font-bold text-gray-400 uppercase mb-2"
              >Yüklenecek Tutar</label
            >
            <input
              id="cash"
              type="number"
              bind:value={loadAmount}
              class="w-full p-4 text-2xl font-black bg-white border-2 border-gray-200 rounded-xl mb-4"
              placeholder="0.00"
            />
            <button
              type="button"
              onclick={handleLoadBalance}
              disabled={isLoading || !loadAmount}
              class="w-full {selectedCustomer.role === 'ogretmen'
                ? 'bg-purple-600 hover:bg-purple-700'
                : 'bg-blue-600 hover:bg-blue-700'} text-white font-black py-4 rounded-xl shadow-lg transition-colors"
              >BAKİYEYİ YÜKLE</button
            >
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if message.text}
    <div
      in:fly={{ y: -20 }}
      out:fade
      class="fixed top-4 right-4 z-9999 p-4 rounded-xl font-bold shadow-2xl {message.type ===
      'success'
        ? 'bg-green-100 text-green-700 border border-green-200'
        : 'bg-red-100 text-red-700 border border-red-200'}"
    >
      {message.text}
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar::-webkit-scrollbar {
    width: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: transparent;
    border-radius: 10px;
  }
  .custom-scrollbar:hover::-webkit-scrollbar-thumb {
    background: #e5e7eb;
  }
</style>
