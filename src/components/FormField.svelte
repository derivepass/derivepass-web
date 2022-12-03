<script type="ts">
  export let type: 'password' | 'text' | 'email' | 'number' = 'text';
  export let label: string;
  export let hint: string | undefined = undefined;
  export let required = false;

  export let value: string | number;

  function onInput(e: { currentTarget: HTMLInputElement; }) {
    if (type === 'number') {
      value = parseInt(e.currentTarget.value, 10);
    } else {
      value = e.currentTarget.value;
    }
  }
</script>

<label>
  <p class="mb-2">{label}</p>

  <input
    class="w-full p-2 rounded border"
    {type}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="none"
    {required}
    aria-required="true"
    on:input={onInput}
    {value}
    />
</label>

{#if hint}
<p class="text-gray-500">
  <small>{hint}</small>
</p>
{/if}
