export function flatten(str: string): ReadonlyArray<string> {
  if (/\s/.test(str)) {
    throw new Error('Can\'t contain whitespace');
  }

  // a-zA-Z
  str = str.replace(/(\w)-(\w)/g, (range, from, to) => {
    const fromCode = from.charCodeAt(0);
    const toCode = to.charCodeAt(0);

    if (from.length !== 1 || fromCode > 0xff) {
      throw new Error(`Invalid starting character in range "${range}"`);
    }
    if (to.length !== 1 || toCode > 0xff) {
      throw new Error(`Invalid ending character in range "${range}"`);
    }

    if (fromCode > toCode) {
      throw new Error(`Invalid range "${range}"`);
    }

    let res = '';
    for (let code = fromCode; code <= toCode; code++) {
      res += String.fromCharCode(code);
    }
    return res;
  });

  // Report invalid ranges
  str.replace(/[^\\]-|[^\\]-\W|^-\W|^-\w?/, (invalid) => {
    throw new Error(`Unterminated range "${invalid}"`);
  });

  // Unescape `\x` => `x`
  str = str.replace(/\\(.)/g, '$1');

  return Array.from(new Set(str.split(''))).sort();
}
