<script lang="ts">
  /**
   * @file src/routes/dashboard/+page.svelte
   * @description Giriş sayfası. Sadece adminler admin paneline giriş yapabilir.
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */

  import { goto } from "$app/navigation";
  import { loginUser } from "$lib/api/auth";

  let email = $state("");
  let password = $state("");
  let isLoading = $state(false);
  let errorMsg = $state("");

  async function handleSubmit(e: Event) {
    e.preventDefault();
    isLoading = true;
    errorMsg = "";

    try {
      await loginUser(email, password);
      // Başarılı olursa Dashboard'a gönder
      goto("/dashboard");
    } catch (error: any) {
      errorMsg = error.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<div
  class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"
>
  <div class="sm:mx-auto sm:w-full sm:max-w-md">
    <div class="text-center text-5xl mb-4">🍔</div>
    <h2 class="text-center text-3xl font-extrabold text-gray-900">
      QR Kantin Yönetimi
    </h2>
    <p class="mt-2 text-center text-sm text-gray-600">
      Kantinci paneline giriş yapın
    </p>
  </div>

  <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div
      class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100"
    >
      <form class="space-y-6" onsubmit={handleSubmit}>
        {#if errorMsg}
          <div class="bg-red-50 border-l-4 border-red-500 p-4">
            <p class="text-sm text-red-700 font-medium">{errorMsg}</p>
          </div>
        {/if}

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
              bind:value={password}
              class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {isLoading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>
        </div>
      </form>
    </div>
  </div>
</div>
