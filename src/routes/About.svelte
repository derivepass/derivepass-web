<script lang="ts">
  import { link } from 'svelte-spa-router';

  import logo from '../assets/logo.svg';

  import ExternalLink from '../components/ExternalLink.svelte';
</script>

<container class="flex flex-row-reverse flex-wrap justify-center items-center text-center sm:text-start">
  <img src={logo} alt="Big Logotype" class="grow max-w-xs lg:max-w-full"/>

  <container class="grow basis-96 mb-4">
    <h1 class="text-4xl font-semibold mb-4">DerivePass</h1>

    <h2 class="text-xl mb-4">
      Compute secure passwords without storing them anywhere.
    </h2>

    <a
      href="/login"
      use:link
      class="inline-block px-4 py-2 rounded-md bg-blue-500 hover:bg-blue-600 text-white text-xl"
    >
      Start
    </a>
  </container>
</container>

<p class="my-2">
  Most websites require a password on Sign Up.
  Using the same password everywhere is insecure.
  Using individual secure passwords and remembering all of them - impossible!
</p>

<p class="my-2">
  <b>DerivePass</b> is here to help with the task!
  Choose the Master Password once and use it to generate an <b>unlimited</b>
  number of secure website passwords.
</p>

<p class="my-2">
  Unlike traditional password managers, <b>DerivePass</b> never uploads
  neither the Master Password or website passwords to the cloud. The only
  information that is stored is <b>encrypted</b> website domain names and
  usernames.
</p>

<hr class="my-4"/>

<h3 class="my-4 text-3xl text-semibold">Privacy</h3>

<p>
  Your privacy is important to us. Your data is stored only locally
  <b>on your computer</b>, by default, unless you manually decide to use
  remote storage (e.g., iCloud). We <b>never</b> store unencrypted website
  domain names, usernames, or passwords. <b>No tracking</b> of any kind is
  used on this website.
</p>

<hr class="my-4"/>

<h3 class="my-4 text-3xl text-semibold">Security</h3>
<h4 class="my-2 text-lg">(Technical Details)</h4>

<p class="my-2">
  The
  <ExternalLink href="https://en.wikipedia.org/wiki/Scrypt">
    scrypt
  </ExternalLink>
  algorithm is used for deriving application passwords and
  encryption/authentication keys. Due to the strong cryptographic properties
  of scrypt, the compromise of any single application password does not
  compromise any other application passwords or the Master password.
</p>

<p class="my-2">
  An application's domain name (website), username, and revision are used for
  generating unique and secure passwords. In particular,
  <code class="border border-slate-200 bg-slate-100 px-1">
    domain/username(#revision)
  </code>
  is used as a
  <ExternalLink href="https://en.wikipedia.org/wiki/Salt_(cryptography)">
    salt
  </ExternalLink>
  parameter of scrypt. Thus every revision increment will result in a
  completely different generated password. This is convenient for changing the
  password whenever it is required.
</p>

<p class="my-2">
  Every bit of information that is stored locally and/or remotely (through
  optional iCloud synchronization) is encrypted with an
  <ExternalLink href="https://en.wikipedia.org/wiki/Advanced_Encryption_Standard">
    AES
  </ExternalLink>
  key generated from the Master Password via the scrypt algorithm, using
  <code class="border border-slate-200 bg-slate-100 px-1">derivepass/aes</code>
  as a salt. The data is further passed to the
  <ExternalLink href="https://en.wikipedia.org/wiki/HMAC">
    HMAC-SHA256
  </ExternalLink>
  algorithm to ensure the data integrity.
</p>
