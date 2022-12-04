#!/usr/bin/env sh

# abort on errors
set -e

# build
npm run build

# navigate into the build output directory
cd dist

# place .nojekyll to bypass Jekyll processing
echo > .nojekyll

# if you are deploying to a custom domain
echo 'derivepass.com' > CNAME

git init
git checkout -B main
git add -A
git commit -m 'deploy'

git push -f git@github.com:derivepass/derivepass-web.git main:gh-pages

cd -
