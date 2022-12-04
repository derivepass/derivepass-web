<script lang="ts">
  import { createForm } from 'felte';

  import FormField from '../components/FormField.svelte';
  import { settings } from '../stores/sync';
  import { AuthTokenResponseSchema } from '../stores/schemas';
  import { fromString as base64FromString } from '../util/b64';

  type Auth = Readonly<{
    host: string;
    username: string;
    password: string;
  }>;

  let error: string | undefined;

  const { form } = createForm<Auth>({
    initialValues: {
      host: $settings?.host ?? '',
      username: '',
      password: '',
    },
    async onSubmit(auth) {
      error = undefined;

      const auth64 = base64FromString(`${auth.username}:${auth.password}`);
      const res = await fetch(`https://${auth.host}/user/token`, {
        method: 'PUT',
        headers: {
          authorization: `Basic ${auth64}`,
        },
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }
      const { token } = AuthTokenResponseSchema.parse(await res.json());

      $settings = {
        host: auth.host,
        token,
      };
    },
    onError() {
      error = 'Invalid credentials or unreachable server';
    }
  });

  async function onUnlink(): Promise<void> {
    let oldSettings = $settings;
    $settings = undefined;
    if (oldSettings === undefined) {
      return;
    }

    // Do best effort to reclaim token.
    try {
      await fetch(`https://${oldSettings.host}/user/token`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${oldSettings.token}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ token: oldSettings.token }),
      });
    } catch {
      // Ignore
    }
  }
</script>

{#if $settings}
  <h2 class="text-3xl mb-4">Synchronization</h2>

  <p class="my-2">
    Synchronizing with <b>{$settings.host}</b>.
  </p>

  <button
    type="reset"
    class="mt-4 px-4 py-2 rounded bg-red-500 hover:bgred-600 text-white
      disabled:bg-red-400"
    on:click|preventDefault={onUnlink}
  >
    Unlink
  </button>
{:else}
  <h2 class="text-3xl mb-4">Setup Synchronization</h2>

  <form use:form>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="host"
      label="Storage server hostname"
      placeholder="storage.example.com"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="username"
      label="Username"
      placeholder="me@my.server"/>
    <FormField
      on:input
      on:change
      on:focus
      on:blur
      required
      name="password"
      type="password"
      label="Password"/>

    {#if error !== undefined}
      <p class="my-2 text-red-500">
        {error}
      </p>
    {/if}

    <button
      type="submit"
      class="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white
        disabled:bg-blue-400"
    >
      Login
    </button>
  </form>
{/if}
