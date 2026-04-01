<script lang="ts">
  /**
   * @file src/routes/+layout.svelte
   * @author Onur Zaim
   * @license Yazılı izin alınmadan ticari amaçla kullanılamaz.
   */
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { browser } from "$app/environment";
  import "./layout.css";

  let { children } = $props();

  let isChecking = $state(true);

  $effect(() => {
    if (!browser) return;

    // "as string" ekleyerek TypeScript'in katı klasör kontrolünü esnetiyoruz
    const currentPath = $page.url.pathname as string;
    const token = localStorage.getItem("token");

    // 1. Kural: Ana sayfaya girilirse
    if (currentPath === "/") {
      if (token) {
        goto("/dashboard");
      } else {
        goto("/login");
      }
    }
    // 2. Kural: Giriş yapmamış biri /dashboard veya alt sayfalarına girmeye çalışırsa
    else if (currentPath.startsWith("/dashboard") && !token) {
      goto("/login");
    }
    // 3. Kural: Zaten giriş yapmış biri tekrar /login sayfasına giderse (Artık /register yok)
    else if (currentPath === "/login" && token) {
      goto("/dashboard");
    }

    isChecking = false;
  });
</script>

{#if isChecking}
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div
      class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"
    ></div>
  </div>
{:else}
  {@render children()}
{/if}
