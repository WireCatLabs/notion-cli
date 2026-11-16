#!/usr/bin/env bash
# The release's live check against the real service (WC-TEST-18, WC-REL-17): a person runs it with a real token on
# stdin, then records it with `pnpm exec cli-dev live record --script scripts/live.sh`. Every folder is a temporary
# one and the keyring is out of reach, so nothing touches the owner's store, keyring or settings.
#   scripts/live.sh <page id or link> < token-file
# The page must hold an uploaded file whose name has parentheses, such as `Screenshot (2).png`: the check fails
# unless Notion's signed file links were seen and cut. It must also hold at least one page under it: the sync files a
# child page from its child_page block, and the check compares that block with the page (docs/dev/SYNC.md).
set -euo pipefail
page=${1:?give a page id or link the token can read: scripts/live.sh <page> < token-file}
root=$(cd -- "$(dirname -- "$0")/.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT

export WCNOTION_CONFIG_DIR="$work/config" WCNOTION_STATE_DIR="$work/state" WCNOTION_CACHE_DIR="$work/cache"
export MESSAGING_STORE="$work/wirecat.db"
export DBUS_SESSION_BUS_ADDRESS="disabled:"
unset WCNOTION_TOKEN
cli=(node "$root/dist/bin/notion.js")

pnpm --dir "$root" -s build >/dev/null </dev/null
# Set after the build, which needs the owner's pnpm store: a CLI that moves its folders on start must not see the
# owner's home.
export HOME="$work/home" XDG_CONFIG_HOME="$work/xdg/config" XDG_DATA_HOME="$work/xdg/data"
export XDG_STATE_HOME="$work/xdg/state" XDG_CACHE_HOME="$work/xdg/cache"
mkdir -p "$HOME"

"${cli[@]}" --wcat-describe </dev/null | node -e '
  const answer = JSON.parse(require("fs").readFileSync(0, "utf8"))
  if (answer.wcat_describe !== 2 || !/^[0-9a-f]{64}$/.test(answer.manifest_sha256)) throw new Error("not format 2")'

"${cli[@]}" live session start --credential-storage file --json >/dev/null
trap '"${cli[@]}" live session end --json >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

"${cli[@]}" live session status --check --json >"$work/status.json"
"${cli[@]}" live databases list --limit 5 --json >"$work/list.json"
"${cli[@]}" live documents get "$page" --json >"$work/page.json"
node -e '
  const read = (name) => JSON.parse(require("fs").readFileSync(`${process.argv[1]}/${name}.json`, "utf8"))
  const status = read("status").item
  if (!status.verified || !/^[0-9a-f-]{36}$/.test(status.workspace?.id ?? "")) throw new Error("users/me gave no workspace id")
  const list = read("list")
  if (!Array.isArray(list.items)) throw new Error("databases list has no items")
  const page = read("page").item
  if (typeof page.markdown !== "string") throw new Error("documents get has no markdown")
  if (!(page.signed_links_removed > 0)) throw new Error("no signed file link was cut: use a page with an uploaded file")
  if (/X-Amz-(Signature|Credential)|[?&;]signature=|%3FX-Amz-/i.test(JSON.stringify(page)))
    throw new Error("a signed file link was not cut")' "$work"
# Read only. A difference is a warning, not a failure: it costs the daily walk work, it loses nothing.
id=$(node -e '
  const page = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).item
  process.stdout.write(page?.id ?? "")' "$work/page.json")
"${cli[@]}" live api get-block-children --block-id "$id" --json >"$work/children.json"
child=$(node -e '
  const answer = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  const block = (answer.item?.results ?? answer.items ?? []).find((one) => one.type === "child_page")
  if (!block) throw new Error("the page has no page under it: add one, the sync files child pages from their blocks")
  process.stdout.write(block.id)' "$work/children.json")
"${cli[@]}" live api retrieve-a-page --page-id "$child" --json >"$work/child.json"
"${cli[@]}" live api get-block-children --block-id "$child" --page-size 1 --json >"$work/grandchildren.json"
node -e '
  const read = (name) => JSON.parse(require("fs").readFileSync(`${process.argv[1]}/${name}.json`, "utf8"))
  const listed = read("children")
  const block = (listed.item?.results ?? listed.items).find((one) => one.id === process.argv[2])
  const page = read("child").item
  const inner = read("grandchildren")
  const holds = (inner.item?.results ?? inner.items ?? []).length > 0
  const warn = (text) => console.error(`warning: the child_page block ${text}`)
  if (block.last_edited_time !== page.last_edited_time)
    warn(`says last edited ${block.last_edited_time}, the page ${page.last_edited_time}`)
  if (typeof block.has_children !== "boolean") warn("has no has_children")
  else if (block.has_children !== holds)
    warn(`says has_children ${block.has_children}, the page holds ${holds ? "blocks" : "none"}`)' "$work" "$child"
first=$(node -e 'const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); process.stdout.write(l.items[0]?.id ?? "")' "$work/list.json")
if [ -n "$first" ]; then "${cli[@]}" live databases show "$first" --json >/dev/null; fi
"${cli[@]}" live doctor --json >/dev/null

"${cli[@]}" live session end --json >/dev/null
echo "live check passed: describe format 2, sign-in, users/me, databases list and show, documents get," \
  "a child_page block against its page, doctor, sign-out"
