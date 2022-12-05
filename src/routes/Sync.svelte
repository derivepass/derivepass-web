<script lang="ts">
  import { createForm } from 'felte';

  import FormField from '../components/FormField.svelte';
  import {
    type RemoteAuth,
    remoteState,
    authorize,
    unlink,
    sync,
  } from '../stores/remoteSync';

  let error: string | undefined;

  const { form } = createForm<RemoteAuth>({
    initialValues: {
      host: $remoteState?.host ?? '',
      username: '',
      password: '',
    },
    async onSubmit(auth) {
      error = undefined;

      return authorize(auth);
    },
    onError() {
      error = 'Invalid credentials or unreachable server';
    }
  });
</script>

{#if $remoteState}
  <h2 class="text-3xl mb-4">Synchronization</h2>

  <p class="my-2">
    {#if $remoteState.lastSyncedAt}
      Last synchronized with <b>{$remoteState.host}</b>
      <br/>
      on <b>{new Date($remoteState.lastSyncedAt).toLocaleString()}</b>.
    {:else}
      Awaiting initial sync with <b>{$remoteState.host}</b>.
    {/if}
  </p>

  <section class="mt-4 flex gap-1">
    <button
      type="button"
      class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        text-white disabled:bg-blue-400"
      on:click|preventDefault={sync}
    >
      Sync Now
    </button>

    <button
      type="reset"
      class="px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white
        disabled:bg-red-400"
      on:click|preventDefault={() => unlink($remoteState)}
    >
      Unlink
    </button>
  </section>
{:else}
  <h2 class="text-3xl mb-4">Setup Synchronization</h2>

  <form use:form>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="host"
      label="Storage server hostname"
      placeholder="storage.example.com"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="username"
      label="Username"
      placeholder="me@my.server"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="password"
      type="password"
      label="Password"/>

    {#if error !== undefined}
      <p class="my-2 text-red-500">
        {error}
      </p>
    {/if}

    <button
      type="submit"
      class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800
        text-white disabled:bg-blue-400"
    >
      Login
    </button>
  </form>
{/if}
