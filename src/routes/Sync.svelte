<script lang="ts">
  import { createForm } from 'felte';
  import { reporter } from '@felte/reporter-svelte';
  import { validator } from '@felte/validator-zod';

  import FormField from '../components/FormField.svelte';
  import { type SyncSettings, SyncSettingsSchema } from '../stores/schemas';
  import { settings } from '../stores/sync';

  const {
    form,
    isDirty,
    isValid,
  } = createForm<SyncSettings>({
    initialValues: $settings,
    onSubmit(newSettings) {
      $settings = newSettings;
      $isDirty = false;
    },
    extend: [
      validator({ schema: SyncSettingsSchema }),
      reporter,
    ],
  });

  function onSync() {
  }
</script>

<h2 class="text-2xl mb-4">Setup Synchronization</h2>

<form use:form>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="host"
    label="Storage server hostname"
    placeholder="storage.example.com"/>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="token"
    type="password"
    label="Auth Token"/>

  <section class="flex my-2">
    <button
      type="submit"
      disabled={$isValid && !$isDirty}
      class="px-4 py-2 rounded-l bg-blue-500 hover:bg-blue-600 text-white
        disabled:bg-blue-400"
    >
      Save
    </button>
    <button
      type="button"
      disabled={!$isValid}
      class="px-4 py-2 last:rounded-r bg-gray-500 hover:bg-gray-600 text-white
        disabled:bg-gray-400"
      on:click|preventDefault={onSync}
    >
      Sync Now
    </button>
  </section>
</form>
