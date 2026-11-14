# notion

`notion` will keep a copy of your Notion pages and databases on your computer, searchable offline together with the
rest of WireCat, and readable by your AI agent through MCP. Later it keeps a folder of Markdown files and a Notion page
tree in step, both ways.

**Status: in design.** Nothing reaches Notion yet; the commands below are the template's sample. The design, the
order of work and the open questions are in [docs/dev/DESIGN.md](docs/dev/DESIGN.md). It was started from
[cli-template](https://github.com/WireCatLabs/cli-template).

## Quick start

```sh
pnpm install
pnpm build
node dist/bin/notion.js doctor
```

`doctor` needs no profile. Every command that uses an account starts with one, a name you choose: `notion personal config show`.
