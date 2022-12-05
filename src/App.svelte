<script lang="ts">
  import { slide } from 'svelte/transition';
  import Router, { replace } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';
  import { useRegisterSW } from 'virtual:pwa-register/svelte';

  import { initPromise as initCrypto } from './crypto/common';
  import { HOUR } from './util/constants';
  import { keys } from './stores/crypto';

  import logo from './assets/logo.svg';

  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Logout from './routes/Logout.svelte';
  import Sync from './routes/Sync.svelte';
  import ApplicationList from './routes/ApplicationList.svelte';
  import Application from './routes/Application.svelte';

  import Link from './components/Link.svelte';

  const {
    needRefresh,
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (!r) {
        return;
      }
      setInterval(() => r.update(), HOUR);
    }
  });

  const isLoggedIn = () => $keys !== undefined;
  const isLoggedOut = () => $keys === undefined;

  const routes = {
    '/': About,
    '/about': About,
    '/sync': Sync,
    '/login': wrap({
      component: Login,
      conditions: [isLoggedOut],
    }),
    '/applications': wrap({
      component: ApplicationList,
      conditions: [isLoggedIn],
    }),
    '/applications/:id': wrap({
      component: Application,
      conditions: [isLoggedIn],
    }),
    '/logout': Logout,

    // 404
    '/*': About,
  };

  function conditionsFailed() {
    replace('/login');
  }
</script>

{#if $needRefresh}
<header transition:slide class="bg-white px-4 py-2 flex items-center gap-4 border-b">
  New version is available:
  <button
    type="submit"
    on:click|preventDefault={() => updateServiceWorker()}
    class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      text-white"
  >
    Reload
  </button>
  <button
    type="reset"
    on:click|preventDefault={() => $needRefresh = false}
    class="px-4 py-2 rounded text-yellow-400 hover:text-yellow-500
      hover:underline"
  >
    Skip
  </button>
</header>
{/if}

<nav class="flex gap-4 items-center p-4">
  <Link href="/">
    <img src={logo} width="32" height="32" alt="Logotype"/>
  </Link>

  {#if $keys === undefined}
    <Link href="/login">Master Password</Link>
  {:else}
    <Link href="/applications">Applications</Link>
  {/if}
  <Link href="/sync">Sync</Link>
  <Link href="/about">About</Link>
  {#if $keys !== undefined}
    <Link href="/logout">Logout</Link>
  {/if}
</nav>

<div class="container mx-auto max-w-screen-md p-4">
  {#await initCrypto then}
    <Router {routes} on:conditionsFailed={conditionsFailed}/>
  {:catch error}
    <b class="text-red-500">
      Failed to initalize cryptography: {error.message}
    </b>
  {/await}
</div>

<style>
</style>
