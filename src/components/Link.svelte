<script type="ts">
  import { link, location } from 'svelte-spa-router';

  export let href: string;

  $: ariaPressed = $location == href;
</script>

<a
  {href}
  aria-pressed={ariaPressed}
  class="text-zinc-500 hover:text-black aria-pressed:text-black"
  use:link
>
  <slot/>
</a>
