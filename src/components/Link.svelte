<script type="ts">
  import { link, location } from 'svelte-spa-router';

  export let href: string;
</script>

<a {href} aria-pressed={$location === href} class="aria-pressed:font-semibold" use:link>
  <slot/>
</a>
