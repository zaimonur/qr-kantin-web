<script lang="ts">
  /**
   * @file src/routes/dashboard/approvals/+page.svelte
   * @description Onay Sistemi: Yeni üye olan öğrencilerin onaylandığı ve bakiye yüklemelerinin yapıldığı panel.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { getPendingStudents, approveStudent } from "$lib/api/users";

  let pendingUsers = $state<any[]>([]);
  let isLoading = $state(true);
  let errorMsg = $state("");
  let successMsg = $state("");

  // Her öğrencinin girilen bakiye değerini tutacağımız state objesi (Kullanıcı ID'sine göre)
  let balances = $state<Record<string, number>>({});
  // Hangi öğrencinin onay butonuna basıldığını takip eden loading state'i
  let isApproving = $state<Record<string, boolean>>({});

  onMount(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      goto("/login");
      return;
    }

    try {
      pendingUsers = await getPendingStudents();
      // Gelen her kullanıcı için varsayılan bakiye inputunu 0 yapıyoruz
      pendingUsers.forEach((u) => {
        balances[u.id] = 0;
      });
    } catch (error: any) {
      errorMsg = error.message;
    } finally {
      isLoading = false;
    }
  });

  async function handleApprove(user: any) {
    const amount = balances[user.id] || 0;

    // Güvenlik teyidi (Eğer 0 TL yükleniyorsa sadece onaylanacak, emin mi diye soruyoruz)
    if (amount === 0) {
      if (
        !confirm(
          `${user.full_name} adlı öğrenciyi Bakiye YÜKLEMEDEN (0 TL ile) onaylamak istediğinize emin misiniz?`,
        )
      ) {
        return;
      }
    }

    isApproving[user.id] = true;
    errorMsg = "";
    successMsg = "";

    try {
      await approveStudent(user.id, amount);
      successMsg = `✅ ${user.full_name} başarıyla onaylandı ve ${amount} TL bakiye eklendi.`;

      // Onaylanan kullanıcıyı yerel state listesinden çıkarıyoruz
      pendingUsers = pendingUsers.filter((u) => u.id !== user.id);
    } catch (error: any) {
      errorMsg = error.message;
    } finally {
      isApproving[user.id] = false;
    }
  }

  // Tarih formatlayıcı
  function formatDate(dateString: string) {
    const d = new Date(dateString);
    return (
      d.toLocaleDateString("tr-TR") +
      " " +
      d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })
    );
  }
</script>

<main class="flex-1 max-w-7xl w-full mx-auto py-8 px-4 sm:px-6 lg:px-8">
  <div class="mb-8 border-b border-gray-200 pb-5">
    <div class="flex items-center gap-3 mb-2">
      <span class="text-3xl">✅</span>
      <h1 class="text-2xl font-bold text-gray-900">Öğrenci Onay Merkezi</h1>
    </div>
    <p class="text-gray-600">
      Mobil uygulamadan kayıt olan öğrencileri buradan onaylayabilir ve ilk
      bakiyelerini cüzdanlarına yükleyebilirsiniz.
    </p>
  </div>

  {#if errorMsg}
    <div
      class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 animate-in fade-in"
    >
      <p class="text-sm text-red-700 font-medium">{errorMsg}</p>
    </div>
  {/if}

  {#if successMsg}
    <div
      class="bg-green-50 border-l-4 border-green-500 p-4 rounded-md mb-6 animate-in fade-in"
    >
      <p class="text-sm text-green-700 font-medium">{successMsg}</p>
    </div>
  {/if}

  {#if isLoading}
    <div class="flex justify-center py-20">
      <div
        class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
      ></div>
    </div>
  {:else if pendingUsers.length === 0}
    <div
      class="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm"
    >
      <span class="text-6xl block mb-4 opacity-50">😴</span>
      <h3 class="text-lg font-medium text-gray-900">Onay Bekleyen Kimse Yok</h3>
      <p class="text-gray-500 mt-1">
        Şu an sistemde onay bekleyen yeni bir öğrenci kaydı bulunmuyor.
      </p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each pendingUsers as user}
        <div
          class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
        >
          <div class="p-5 border-b border-gray-100 bg-gray-50">
            <div class="flex justify-between items-start">
              <div>
                <h3 class="font-bold text-lg text-gray-900">
                  {user.full_name}
                </h3>
                <p class="text-sm text-gray-500 mt-1">{user.email}</p>
              </div>
              <span
                class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-yellow-200"
              >
                Onay Bekliyor
              </span>
            </div>
            <p class="text-xs text-gray-400 mt-3">
              Kayıt: {formatDate(user.created_at)}
            </p>
          </div>

          <div class="p-5">
            <label
              for="balance-{user.id}"
              class="block text-sm font-bold text-gray-700 mb-2"
            >
              💳 İlk Bakiye Yükleme (TL)
            </label>
            <div class="flex items-center gap-3">
              <input
                id="balance-{user.id}"
                type="number"
                min="0"
                step="10"
                bind:value={balances[user.id]}
                class="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm font-bold text-lg"
                placeholder="Örn: 100"
              />
              <button
                type="button"
                onclick={() => handleApprove(user)}
                disabled={isApproving[user.id]}
                class="shrink-0 bg-green-600 text-white px-4 py-2.5 rounded-md font-bold hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-70 transition-colors"
              >
                {isApproving[user.id] ? "⏳ İşleniyor..." : "Onayla"}
              </button>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</main>
