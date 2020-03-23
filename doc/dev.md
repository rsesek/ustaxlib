# Developer Workflows

## Publishing Releases

Only the dist/ directory, containing the compiled TypeScript files are put into the NPM package. The
`build.sh` script copies non-`tsc`-processed files, and does some processing of the `package.json`.
To publish a new release, just run:

    npm run npm-publish
