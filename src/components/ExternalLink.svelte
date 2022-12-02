<script type="ts">
  export let href: string;
</script>

<a
  {href}
  target="_blank"
  rel="noreferrer"
  class="text-blue-600 hover:underline"
>
  <slot/>
</a>
