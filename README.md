# @1hive/default-token-list

[![Tests](https://github.com/Uniswap/token-lists/workflows/Tests/badge.svg)](https://github.com/1Hive/default-token-list/actions?query=workflow%3ATests)
[![npm](https://img.shields.io/npm/v/@1hive/default-token-list)](https://unpkg.com/@1hive/default-token-list@latest/)

This NPM module and GitHub repo contains the default token list used in the Honeyswap interface.

## Adding a token

To request that we add a token to the list,
[file an issue](https://github.com/1Hive/default-token-list/issues/new?assignees=&labels=token+request&template=token-request.md&title=Add+%7BTOKEN_SYMBOL%7D%3A+%7BTOKEN_NAME%7D).

### Disclaimer

Note filing an issue does not guarantee addition to this default token list.
We do not review token addition requests in any particular order, and we do not
guarantee that we will review your request to add the token to the default list. 

### Submit a PR 
If you want a token to be added to the token list you can submit a PR , make sure ```npm test``` is not giving any error.

### Deploy new version
Use feat() & patch() in your commit to pump the version
example: 

```
feat(add): xDAI

BREAKING CHANGE: description on why this is a breaking change. 
```
Once the PR is merge -> Go to the actions tab in the repository, and trigger the deploy action.

