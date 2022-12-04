<script lang="ts">
  import { push, replace } from 'svelte-spa-router';
  import ApplicationInfo from '../components/ApplicationInfo.svelte';
  import { apps } from '../stores/apps';
  import type { Application } from '../stores/schemas';

  export let params: { id: string };

  $: isNew = params.id === 'new';

  $: app = isNew ? apps.getTemplate() : apps.getById(params.id);

  function onSubmit({ detail: newApp }: CustomEvent<Application>) {
    apps.save(newApp);
    if (isNew) {
      push(`/applications/${newApp.id}`);
    }
  }

  function onDelete() {
    if (app) {
      apps.deleteById(app.id);
    }
    push('/applications');
  }
</script>

{#if app}
  <ApplicationInfo {isNew} {app} on:submit={onSubmit} on:delete={onDelete}/>
{:else}
  {(() => replace('/applications'))()}
{/if}
