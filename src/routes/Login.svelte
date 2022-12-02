<script lang="ts">
  const onSubmit = () => {
  };
</script>

<form autocomplete="off" on:submit|preventDefault={onSubmit}>
  <label>
    <p class="mb-2">Enter your Master Password:</p>
    <input
      class="w-full p-2 rounded border"
      type="password"
      autocomplete="off"
      required
      aria-required="true"
      />
  </label>
  <p class="text-gray-500">
    <small>Used for decrypting storage and computing passwords</small>
  </p>

  <input
    class="inline-block mt-4 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-400"
    type="submit"
    value="Decrypt"
    disabled
    />
</form>
