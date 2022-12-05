<script lang="ts">
  import { push } from 'svelte-spa-router';

  import ApplicationCard from '../components/ApplicationCard.svelte';
  import { apps } from '../stores/apps';

  let filter = '';

  $: lowerCaseFilter = filter.toLowerCase();

  $: filteredApps = $apps.filter(({ domain, login }) => {
    return `${domain}/${login}`.toLowerCase().includes(lowerCaseFilter);
  });

  function onAdd() {
    push('/applications/new');
  }

  function onSubmit() {
    // Ignore
  }
</script>

<form
  class="flex items-center rounded focus-within:ring"
  autocomplete="off"
  on:submit|preventDefault={onSubmit}
>
  <input
    class="grow px-4 py-2 min-w-0 rounded-l border focus:outline-none"
    type="text"
    autocomplete="off"
    placeholder="Filter applications"
    bind:value={filter}
    />
  <input
    class="shrink px-4 py-2 rounded-r border-y
      border-blue-600 hover:border-blue-700 active:border-blue-800
      bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
    type="button"
    value="Add application"
    on:click|preventDefault={onAdd}
    />
</form>

{#each filteredApps as app (app.id)}
  <ApplicationCard id={app.id} domain={app.domain} login={app.login}/>
{/each}
