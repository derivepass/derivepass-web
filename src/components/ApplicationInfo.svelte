<script lang="ts">
  import { pop as goBack, replace } from 'svelte-spa-router';
  import { createForm } from 'felte';
  import { reporter } from '@felte/reporter-svelte';
  import { validator } from '@felte/validator-zod';

  import {
    type Application,
    type ApplicationData,
    ApplicationDataSchema,
  } from '../stores/schemas';
  import FormField from '../components/FormField.svelte';
  import Spinner from '../components/Spinner.svelte';

  import { keys } from '../stores/crypto';
  import { computePassword } from '../util/crypto';
  import { SECOND } from '../util/constants';

  export let app: Application;
  export let isNew: boolean;

  enum PasswordState {
    Initial,
    Computing,
    Computed,
    Copied,
  }

  // State
  let isEditing = isNew;
  let isShowingExtra = false;
  let password: string | undefined;
  let passwordState = PasswordState.Initial;
  let justCopiedTimer: NodeJS.Timeout | undefined;

  async function onComputeOrCopy() {
    const presentKeys = $keys;
    if (presentKeys === undefined) {
      replace('/');
      return;
    }

    if (passwordState === PasswordState.Initial) {
      passwordState = PasswordState.Computing;
      setTimeout(() => {
        password = computePassword(presentKeys, {
          ...app,
          ...$data,
        });
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

  const { form, data, reset, isDirty, isValid } = createForm<ApplicationData>({
    initialValues: app,
    onSubmit(values) {
      console.log(values);
    },
    extend: [
      validator({ schema: ApplicationDataSchema }),
      reporter,
    ],
  });

  function onDelete() {
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

<h2 class="text-2xl"><b>{$data.domain}</b>/{$data.login}</h2>

<section class="mt-2 mb-4 flex gap-1 content-center">
  <button
    on:click|preventDefault={onComputeOrCopy}
    disabled={passwordState === PasswordState.Computing}
    class="mr-2 px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
      disabled:bg-blue-400"
  >
    {#if passwordState === PasswordState.Initial}
      Compute password
    {:else if passwordState === PasswordState.Computing}
      <div class="flex gap-1">
        <Spinner/> Computing...
      </div>
    {:else if passwordState === PasswordState.Computed}
      Copy password
    {:else}
      Copied
    {/if}
  </button>
  <button class="mr-2" on:click|preventDefault={toggleEditing}>Edit</button>
  <button on:click|preventDefault={onBack}>Back</button>
</section>

<form use:form class:hidden={!isEditing}>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="domain"
    label="Domain name"
    hint="Examples: google.com, fb.com, etc"/>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="login"
    type="email"
    label="Username"
    hint="Examples: my_user_name, derivepass82"/>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="revision"
    type="number"
    label="Revision"
    hint="Increment this by one to change the password"/>

  <button
    type="button"
    class="my-2 px-4 py-2 rounded border border-red-500 hover:border-red-600
      text-red-500 hover:text-red-600"
    on:click|preventDefault={toggleExtra}
  >
    Extra
  </button>

  <section class="my-2" class:hidden={!isShowingExtra}>
    <p class="text-red-500 my-2">
      Most applications don't require editing options below.
    </p>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      name="allowedChars"
      label="Allowed characters"
      hint="Characters that can be present in the password"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      name="requiredChars"
      label="Required characters"
      hint="Characters that must be present in the password"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      name="passwordLen"
      type="number"
      label="Password length"/>
  </section>

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
      type="reset"
      disabled={!$isDirty}
      class="px-4 py-2 last:rounded-r bg-gray-500 hover:bg-gray-600 text-white
        disabled:bg-gray-400"
      on:click|preventDefault={reset}
    >
      Reset
    </button>

    {#if !isNew}
      <button
        type="button"
        class="px-4 py-2 last:rounded-r bg-red-500 hover:bg-red-600 text-white
          disabled:bg-red-400"
        on:click|preventDefault={onDelete}
      >
        Delete
      </button>
    {/if}
  </section>
</form>
