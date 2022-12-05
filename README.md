# DerivePass

![Logotype](https://raw.githubusercontent.com/derivepass/derivepass-web/main/src/assets/logo.svg)

*Compute secure passwords without storing them anywhere*

## About

DerivePass - is Password Manager that never stores your passwords anywhere: not
in the Cloud, and not even locally! Instead, the passwords are generated
on-the-fly by using the Master Password and the combination of domain-name and
login. This way, the passwords are unique for each website and at the same time
compromising a single password does not compromise others.

The project is a [Svelte](https://svelte.dev/) application, written in a
TypeScript.

## Development

You will need [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) to
compile the WebAssembly worker, so make sure that it is installed and available
in your path before starting!

```sh
npm install
npm run build:wasm
npm run dev
```


#### LICENSE

This software is licensed under the MIT License.

Copyright Fedor Indutny, 2022.

Permission is hereby granted, free of charge, to any person obtaining a
copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.
