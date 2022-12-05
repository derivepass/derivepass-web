<script type="ts">
  import { link } from 'svelte-spa-router';

  export let id: string;
  export let domain: string;
  export let login: string;
</script>

<a
  href="/applications/{id}"
  use:link
  class="px-4 text-blue-600 py-8 rounded border my-4
    flex flex-col hover:bg-gray-100">
  <h3 class="text-lg font-semibold">{domain}</h3>
  {login}
</a>
