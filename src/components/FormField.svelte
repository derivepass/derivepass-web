<script type="ts">
  import { ValidationMessage } from '@felte/reporter-svelte';

  export let name: string | undefined = undefined;
  export let type: 'password' | 'text' | 'email' | 'number' = 'text';
  export let label: string;
  export let hint: string | undefined = undefined;
  export let required = false;
  export let disabled = false;

  export let value: string | number | undefined = undefined;

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
    class="w-full p-2 rounded border
      outline-2 aria-[invalid]:outline aria-[invalid]:outline-red-500"
    {name}
    {type}
    autocomplete="off"
    autocorrect="off"
    autocapitalize="none"
    {required}
    {disabled}
    aria-required={required}
    on:input={onInput}
    {value}
    />
</label>

{#if hint}
<p class="text-gray-500">
  <small>{hint}</small>
</p>
{/if}

{#if name !== undefined}
  <ValidationMessage for={name} let:messages={message}>
    <p class="text-red-500 my-2">{message}</p>
    <span slot="placeholder"></span>
  </ValidationMessage>
{/if}
