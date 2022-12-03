<script lang="ts">
  import FormField from '../components/FormField.svelte';

  let password = '';

  function onSubmit() {
  }
</script>

<form autocomplete="off" on:submit|preventDefault={onSubmit}>
  <FormField
    type="password"
    label="Enter your Master Password"
    hint="Used for decrypting storage and computing passwords"
    bind:value={password}
  />

  <input
    class="mt-4 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
      disabled:bg-blue-400"
    type="submit"
    value="Decrypt"
    disabled
    />
</form>
