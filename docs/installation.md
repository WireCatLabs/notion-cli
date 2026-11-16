# Install

Install `notion` once on each computer where you or an agent use it. You need Node.js 22.16 or a later 22.x, or 24 or later; Node 23 is not supported.

```sh
npm install -g @wirecat/notion-cli
notion --version
```

Check the installation, then pick a profile name for your account, such as `personal`:

```sh
notion doctor
```

`doctor` needs no network and opens no keyring. It shows the version, where settings live, the profiles that
exist, and whether other users of the computer can read the settings.

## Sign in

Sign the profile in with a Notion token:

```sh
notion personal session start
```

The command asks for the token without showing it, or reads it from stdin. It takes either kind of token:

- a [personal access token](https://developers.notion.com/guides/connections-and-tokens/personal-access-tokens),
  which acts with your own rights;
- an internal connection's token, which sees only the pages shared with that connection.

Notion checks the token first. Then it goes into the OS keyring. Where no keyring works, add
`--credential-storage file` to keep it in a private file. `notion personal session end` forgets the token on this computer. The token itself
stays valid in Notion.

Next: [use it](usage.md).
