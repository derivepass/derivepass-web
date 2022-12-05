<script lang="ts">
  import { push } from 'svelte-spa-router';

  import FormField from '../components/FormField.svelte';
  import Spinner from '../components/Spinner.svelte';
  import { computeKeys } from '../crypto/keys';
  import { keys } from '../stores/crypto';

  let password = '';
  let isComputing = false;

  async function onSubmit() {
    isComputing = true;

    $keys = await computeKeys(password);

    isComputing = false;
    push('/applications');
  }
</script>

<form autocomplete="off" on:submit|preventDefault={onSubmit}>
  <FormField
    type="password"
    label="Enter your Master Password"
    hint="Used for decrypting storage and computing passwords"
    bind:value={password}
    disabled={isComputing}
  />

  <button
    class="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
      disabled:bg-blue-400 flex gap-2 items-center"
    type="submit"
    disabled={!password || isComputing}
  >
    {#if isComputing}
      <Spinner/>
      Decrypting Storage
    {:else}
      Decrypt Storage
    {/if}
  </button>
</form>
