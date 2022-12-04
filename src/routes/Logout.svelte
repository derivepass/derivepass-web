<script type="ts">
  import { replace } from 'svelte-spa-router';

  import { keys } from '../stores/crypto';

  $keys = undefined;
  replace('/login');
</script>
