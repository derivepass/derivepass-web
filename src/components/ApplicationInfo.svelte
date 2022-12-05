<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { push, replace } from 'svelte-spa-router';
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
  import { computePassword } from '../crypto/keys';
  import { SECOND } from '../util/constants';

  export let app: Application;
  export let isNew: boolean;

  enum PasswordState {
    Initial,
    Computing,
    Computed,
    Copied,
  }

  enum DeleteState {
    Initial,
    Safety,
    Confirming,
  }

  // State
  let isEditing = isNew;
  let isShowingExtra = false;
  let password: string | undefined;
  let passwordState = PasswordState.Initial;
  let deleteState = DeleteState.Initial;
  let justCopiedTimer: number | undefined;
  let deleteSafetyTimer: number | undefined;

  onDestroy(() => {
    if (justCopiedTimer !== undefined) {
      clearTimeout(justCopiedTimer);
      justCopiedTimer = undefined;
    }
    if (deleteSafetyTimer !== undefined) {
      clearTimeout(deleteSafetyTimer);
      deleteSafetyTimer = undefined;
    }
  });

  async function onComputeOrCopy() {
    const presentKeys = $keys;
    if (presentKeys === undefined) {
      replace('/');
      return;
    }

    if (passwordState === PasswordState.Initial) {
      passwordState = PasswordState.Computing;

      password = await computePassword(presentKeys, {
        ...app,
        ...$data,
      });
      passwordState = PasswordState.Computed;
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

  const dispatch = createEventDispatcher();

  const {
    form,
    data,
    reset,
    setInitialValues,
    isDirty,
    isValid,
  } = createForm<ApplicationData>({
    initialValues: app,
    onSubmit(newData) {
      setInitialValues(newData);
      $isDirty = false;

      dispatch('submit', newData);
    },
    extend: [
      validator({ schema: ApplicationDataSchema }),
      reporter,
    ],
  });

  function onDelete() {
    if (deleteState === DeleteState.Initial) {
      deleteState = DeleteState.Safety;
      deleteSafetyTimer = setTimeout(() => {
        deleteSafetyTimer = undefined;
        deleteState = DeleteState.Confirming;
      }, 5 * SECOND);
    } else if (deleteState === DeleteState.Safety) {
      return;
    } else if (deleteState === DeleteState.Confirming) {
      dispatch('delete');
      deleteState = DeleteState.Initial;
    }
  }

  function toggleEditing() {
    isEditing = !isEditing;
  }

  function onBack() {
    push('/applications');
  }

  function toggleExtra() {
    isShowingExtra = !isShowingExtra;
  }
</script>

{#if isNew}
  <h2 class="text-2xl">New Application</h2>
{:else}
  <h2 class="text-2xl"><b>{$data.domain}</b>/{$data.login}</h2>
{/if}

<section class="mt-2 mb-4 flex gap-4 content-center">
  <button
    on:click|preventDefault={onComputeOrCopy}
    disabled={!$isValid || passwordState === PasswordState.Computing}
    class="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700 active:bg-blue-800
      text-white disabled:bg-blue-400"
  >
    {#if passwordState === PasswordState.Initial}
      Compute password
    {:else if passwordState === PasswordState.Computing}
      <div class="flex gap-2 items-center">
        <Spinner/> Computing...
      </div>
    {:else if passwordState === PasswordState.Computed}
      Copy password
    {:else}
      Copied
    {/if}
  </button>
  <button
    on:click|preventDefault={toggleEditing}
    class="text-blue-600 hover:text-blue-700 hover:underline"
  >
    Edit
  </button>
  <button
    on:click|preventDefault={onBack}
    class="text-blue-600 hover:text-blue-700 hover:enabled:underline
      disabled:text-gray-400"
    disabled={$isDirty}
  >
    Back
  </button>
</section>

<form use:form class:hidden={!isEditing}>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="domain"
    label="Domain name"
    placeholder="mastodon.social"
    hint="Examples: google.com, fb.com, etc"/>
  <FormField
    on:input
    on:change
    on:focus
    on:blur
    name="login"
    type="email"
    label="Username"
    placeholder="my@email.com"
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
      class="px-4 py-2 rounded-l bg-blue-600 hover:bg-blue-700
        active:bg-blue-800 text-white disabled:bg-blue-400"
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
        disabled={deleteState === DeleteState.Safety}
      >
        {#if deleteState === DeleteState.Initial}
          Delete
        {:else}
          Confirm Deletion
        {/if}
      </button>
    {/if}
  </section>
</form>
