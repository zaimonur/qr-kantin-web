<script lang="ts">
  /**
   * @file src/routes/dashboard/register/+page.svelte
   * @description Kantinci Kayıt Paneli : Kantinci veye bir yetkili ekleyip kantin paneline giren kullanıcıları çoğaltabilinen panel.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */
  import { registerUser } from "$lib/api/auth";

  let fullName = $state("");
  let email = $state("");
  let password = $state("");
  let isLoading = $state(false);
  let errorMsg = $state("");
  let successMsg = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    errorMsg = "";
    successMsg = "";

    try {
      await registerUser(fullName, email, password, "admin");
      successMsg =
        "Kayıt başarılı! Yeni yetkili artık sisteme giriş yapabilir.";

      // Formu temizle ki peş peşe kayıt eklenebilsin
      fullName = "";
      email = "";
      password = "";
    } catch (error: any) {
      errorMsg = error.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<main class="flex-1 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center text-5xl mb-4">🛡️</div>
    <h2 class="text-center text-3xl font-extrabold text-gray-900">
      Yeni Yetkili Ekle
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Kantine yeni bir görevli veya admin tanımlayın
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div
      class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100"
    >
      <form class="space-y-6" onsubmit={handleSubmit}>
        {#if errorMsg}
          <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p class="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        {/if}

        {#if successMsg}
          <div class="bg-green-50 border-l-4 border-green-500 p-4 rounded-md">
            <p class="text-sm text-green-700 font-medium">{successMsg}</p>
          </div>
        {/if}

        <div>
          <label for="fullName" class="block text-sm font-medium text-gray-700"
            >Ad Soyad</label
          >
          <div class="mt-1">
            <input
              id="fullName"
              type="text"
              required
              bind:value={fullName}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Örn: Onur Zaim"
            />
          </div>
        </div>

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700"
            >E-posta Adresi</label
          >
          <div class="mt-1">
            <input
              id="email"
              type="email"
              required
              bind:value={email}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700"
            >Şifre</label
          >
          <div class="mt-1">
            <input
              id="password"
              type="password"
              required
              minlength="6"
              bind:value={password}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 transition-colors"
          >
            {isLoading ? "Yetkili Ekleniyor..." : "Yetkiliyi Kaydet"}
          </button>
        </div>
      </form>
    </div>
  </div>
</main>
