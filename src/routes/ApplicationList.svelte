<script lang="ts">
  import ApplicationCard from '../components/ApplicationCard.svelte';
</script>

<form
  class="flex items-center"
  autocomplete="off"
  on:submit|preventDefault={() => {}}
>
  <input
    class="grow px-4 py-2 min-w-0 rounded-l border focus:outline-none"
    type="search"
    autocomplete="off"
    placeholder="Filter applications"
    />
  <input
    class="shrink px-4 py-2 rounded-r border-y border-blue-500
      hover:border-blue-600 bg-blue-500 hover:bg-blue-600 text-white"
    type="submit"
    value="Add application"
    />
</form>

<ApplicationCard id="123" domain="signal.org" login="indutny"/>
