<script lang="ts">
  import ApplicationInfo from '../components/ApplicationInfo.svelte';

  export let params: { id: string };

  const isNew = params.id === 'new';

  const app = {
    id: 'id',
    v: 1,
    domain: 'signal.org',
    login: 'indutny',
    revision: 1,
    allowedChars: 'a-zA-Z0-9_.',
    requiredChars: '',
    passwordLen: 24,
  };
</script>

<ApplicationInfo {isNew} {app}/>
