<script lang="ts">
  import { pop as goBack } from 'svelte-spa-router';

  import type { Application } from '../stores/schemas';
  import FormField from '../components/FormField.svelte';

  import { computePassword } from '../crypto';
  import { SECOND } from '../util/constants';

  export let app: Application;
  export let isNew: boolean;

  enum PasswordState {
    Initial,
    Computing,
    Computed,
    Copied,
  }

  // TODO(indutny): load it from store
  const master = 'masterpassword';

  let edited = { ...app };

  // State
  let isEditing = isNew;
  let isShowingExtra = true;
  let hasChanges = false;
  let password: string | undefined;
  let passwordState = PasswordState.Initial;
  let justCopiedTimer: NodeJS.Timeout | undefined;

  async function onComputeOrCopy() {
    if (passwordState === PasswordState.Initial) {
      passwordState = PasswordState.Computing;
      setTimeout(() => {
        password = computePassword(master, edited);
        passwordState = PasswordState.Computed;
      }, 0);
      return;
    }

    navigator.clipboard.writeText(password ?? '');

    if (justCopiedTimer !== undefined) {
      clearTimeout(justCopiedTimer);
    }

    passwordState = PasswordState.Copied;
    justCopiedTimer = setTimeout(() => {
      justCopiedTimer = undefined;
      passwordState = PasswordState.Computed;
    }, 5 * SECOND);

    return;
  }

  function onSave() {
  }

  function toggleEditing() {
    isEditing = !isEditing;
  }

  function onBack() {
    goBack();
  }

  function toggleExtra() {
    isShowingExtra = !isShowingExtra;
  }
</script>

<h2 class="text-2xl"><b>{edited.domain}</b>/{edited.login}</h2>

<section class="mt-2 mb-4">
  <button
    on:click|preventDefault={onComputeOrCopy}
    disabled={passwordState === PasswordState.Computing}
    class="mt-2 mr-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
      disabled:bg-blue-400"
  >
    {#if passwordState === PasswordState.Initial}
      Compute password
    {:else if passwordState === PasswordState.Computing}
      Computing...
    {:else if passwordState === PasswordState.Computed}
      Copy password
    {:else}
      Copied
    {/if}
  </button>
  <button class="mr-2" on:click|preventDefault={toggleEditing}>Edit</button>
  <button on:click|preventDefault={onBack}>Back</button>
</section>

{#if isEditing}
  <form on:submit|preventDefault={onSave}>
    <FormField
      label="Domain name"
      hint="Examples: google.com, fb.com, etc"
      bind:value={edited.domain}/>
    <FormField
      type="email"
      label="Username"
      hint="Examples: my_user_name, derivepass82"
      bind:value={edited.login}/>
    <FormField
      type="number"
      label="Revision"
      hint="Increment this by one to change the password"
      bind:value={edited.revision}/>

    <button
      type="button"
      class="my-2 px-4 py-2 rounded border border-red-500 hover:border-red-600
        text-red-500 hover:text-red-600"
      on:click|preventDefault={toggleExtra}
    >
      Extra
    </button>

    {#if isShowingExtra}
      <section class="my-2">
        <p class="text-red-500 my-2">
          Most applications don't require editing options below.
        </p>
        <FormField
          label="Allowed characters"
          hint="Characters that can be present in the password"
          bind:value={edited.allowedChars}/>
        <FormField
          label="Required characters"
          hint="Characters that must be present in the password"
          bind:value={edited.requiredChars}/>
        <FormField
          type="number"
          label="Password length"
          bind:value={edited.passwordLen}/>
      </section>
    {/if}

    <section class="flex my-2">
      <button
        type="submit"
        disabled={!hasChanges}
        class="px-4 py-2 rounded-l bg-blue-500 hover:bg-blue-600 text-white
          disabled:bg-blue-400"
      >
        Save
      </button>
      <button
        type="reset"
        disabled={!hasChanges}
        class="px-4 py-2 last:rounded-r bg-gray-500 hover:bg-gray-600 text-white
          disabled:bg-gray-400"
      >
        Reset
      </button>

      {#if !isNew}
        <button
          type="button"
          class="px-4 py-2 last:rounded-r bg-red-500 hover:bg-red-600 text-white
            disabled:bg-red-400"
        >
          Delete
        </button>
      {/if}
    </section>
  </form>
{/if}
