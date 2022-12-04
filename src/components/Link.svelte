<script type="ts">
  import { link } from 'svelte-spa-router';
  import active from 'svelte-spa-router/active';

  export let href: string;
</script>

<a
  {href}
  class="text-zinc-500 hover:text-black"
  use:link
  use:active={{ className: 'text-black' }}
>
  <slot/>
</a>
