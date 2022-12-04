<script lang="ts">
  import Router, { replace } from 'svelte-spa-router';
  import { wrap } from 'svelte-spa-router/wrap';

  import { initPromise as initCrypto } from './util/crypto';
  import { keys } from './stores/crypto';

  import logo from './assets/logo.svg';

  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Logout from './routes/Logout.svelte';
  import Sync from './routes/Sync.svelte';
  import ApplicationList from './routes/ApplicationList.svelte';
  import Application from './routes/Application.svelte';

  import Link from './components/Link.svelte';

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
