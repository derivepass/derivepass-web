export type PasswordOptions = Readonly<{
  requiredChars: string;
  allowedChars: string;
  passwordLen: number;
}>;

export const DEFAULT_OPTIONS: PasswordOptions = {
  allowedChars: 'a-zA-Z0-9_.',
  requiredChars: '',
  passwordLen: 24,
};

type RawEntry = Readonly<{
  alias?: ReadonlyArray<string>;
  options?: Partial<PasswordOptions>;
}>;

const RAW = new Map<string, RawEntry>([
  ['avid.com', {
    options: {
      requiredChars: '@',
    },
  }],

  ['davidstea.com', {
    options: {
      requiredChars: '@',
    },
  }],

  ['easyjet.com', {
    options: {
      passwordLen: 20,
    },
  }],

  ['facebook.com', {
    alias: [ 'fb.com' ],
  }],

  ['hrblock.com', {
    options: {
      requiredChars: '$',
    },
  }],

  ['italki.com', {
    options: {
      passwordLen: 20,
    },
  }],

  ['google.com', {
    alias: [ 'accounts.google.com', 'gmail.com', 'youtube.com' ],
  }],

  ['live.com', {
    alias: [ 'signup.live.com' ],
    options: {
      requiredChars: '@',
    },
  }],

  ['nic.ru', {
    options: {
      allowedChars: 'a-zA-Z0-9',
    },
  }],

  // NOTE: >= 3 repeating characters are disallowed
  ['nintendo.com', {
    alias: [ 'accounts.nintendo.com' ],
    options: {
      requiredChars: '@',
      passwordLen: 20,
    },
  }],

  ['nyumlc.org', {
    options: {
      passwordLen: 20,
    },
  }],

  ['parcelpending.com', {
    options: {
      requiredChars: '$@',
    },
  }],

  ['paypal.com', {
    options: {
      requiredChars: '@',
      passwordLen: 20,
    },
  }],

  ['pokemon.com', {
    options: {
      requiredChars: '@',
    },
  }],

  ['redislabs.com', {
    options: {
      requiredChars: '$',
    },
  }],

  ['rentcafe.com', {
    options: {
      requiredChars: '@',
    },
  }],

  ['spectrum.net', {
    options: {
      passwordLen: 20,
    },
  }],

  ['teladoc.com', {
    options: {
      requiredChars: '#',
    },
  }],

  ['yahoo.com', {
    alias: [ 'login.yahoo.com' ],
  }],

  ['ybr.com', {
    options: {
      requiredChars: '@',
      passwordLen: 20,
    },
  }],
]);

export type Preset = Readonly<{
  domain: string;
  options: PasswordOptions;
}>;

const PRESETS = new Map<string, Preset>();

for (const [domain, { alias = [], options = {} }] of RAW) {
  for (const domainOrAlias of [domain, ...alias]) {
    PRESETS.set(domainOrAlias, {
      domain,

      options: {
        ...DEFAULT_OPTIONS,
        ...options,
      },
    });
  }
}

export default PRESETS;

export function isDefaultOptions({
  allowedChars,
  requiredChars,
  passwordLen,
}: PasswordOptions, defaults = DEFAULT_OPTIONS): boolean {
  return allowedChars === defaults.allowedChars &&
    requiredChars === defaults.requiredChars &&
    passwordLen === defaults.passwordLen;
}
