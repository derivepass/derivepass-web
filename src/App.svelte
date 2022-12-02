<script lang="ts">
  import Router, { replace } from 'svelte-spa-router';

  import logo from './assets/logo.svg';

  import About from './routes/About.svelte';
  import Login from './routes/Login.svelte';
  import Settings from './routes/Settings.svelte';
  import ApplicationList from './routes/ApplicationList.svelte';
  import Application from './routes/Application.svelte';

  import Link from './components/Link.svelte';

  const routes = {
    '/': About,
    '/about': About,
    '/login': Login,
    '/settings': Settings,
    '/applications': ApplicationList,
    '/applications/:id': Application,

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

  <Link href="/login">Master Password</Link>
  <Link href="/applications">Applications</Link>
  <Link href="/settings">Settings</Link>
  <Link href="/about">About</Link>
</nav>

<div class="container mx-auto max-w-screen-md p-4">
  <Router {routes} on:conditionsFailed={conditionsFailed}/>
</div>

<style>
</style>
