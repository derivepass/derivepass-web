<script lang="ts">
  import FormField from '../components/FormField.svelte';

  import { computePassword } from '../crypto';

  export let params: { id: string };

  const isNew = params.id === 'new';

  // TODO(indutny): load it from store
  const master = 'masterpassword';

  let domain = 'signal.org';
  let login = 'indutny';
  let revision = 1;
  let allowedChars = 'a-zA-Z0-9_.';
  let requiredChars = '';
  let passwordLen = 24;

  // State
  let isEditing = true;
  let isShowingExtra = true;
  let hasChanges = false;

  function onCompute() {
    const password = computePassword({
      master,
      domain: `${domain}/${login}${revision > 1 ? `#${revision}` : ''}`,
      requiredChars,
      allowedChars,
      passwordLen,
    });
    console.log(password);
  }

  function onSave() {
  }

  function toggleEditing() {
    isEditing = !isEditing;
  }

  function toggleExtra() {
    isShowingExtra = !isShowingExtra;
  }
</script>

<h2 class="text-2xl"><b>{domain}</b>/{login}</h2>

<section class="mt-2 mb-4">
  <button
    on:click|preventDefault={onCompute}
    class="mt-2 mr-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
      disabled:bg-blue-400"
  >
    Compute password
  </button>
  <button class="mr-2" on:click|preventDefault={toggleEditing}>Edit</button>
  <button>Back</button>
</section>

{#if isEditing}
  <form on:submit|preventDefault={onSave}>
    <FormField
      label="Domain name"
      hint="Examples: google.com, fb.com, etc"
      bind:value={domain}/>
    <FormField
      type="email"
      label="Username"
      hint="Examples: my_user_name, derivepass82"
      bind:value={login}/>
    <FormField
      type="number"
      label="Revision"
      hint="Increment this by one to change the password"
      bind:value={revision}/>

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
          bind:value={allowedChars}/>
        <FormField
          label="Required characters"
          hint="Characters that must be present in the password"
          bind:value={requiredChars}/>
        <FormField
          type="number"
          label="Password length"
          bind:value={passwordLen}/>
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
