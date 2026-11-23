#!/usr/bin/env bash
# The release's live check against the real service (WC-TEST-18, WC-REL-17): a person runs it with a real token on
# stdin, then records it with `pnpm exec cli-dev live record --script scripts/live.sh`. Every folder is a temporary
# one and the keyring is out of reach, so nothing touches the owner's store, keyring or settings.
#   scripts/live.sh <page id or link> < token-file
# The page must hold an uploaded file whose name has parentheses, such as `Screenshot (2).png`: the check fails
# unless Notion's signed file links were seen and cut. It must also hold at least one page under it: the sync files a
# child page from its child_page block, and the check compares that block with the page (docs/dev/SYNC.md).
# It writes only under that page: it creates one page `wirecat-live-<time>` there with a page under it, changes,
# trashes and restores it, comments on it, replies, uploads a small text file to it, and leaves it in Notion's trash.
# No other page is changed (docs/dev/DESIGN.md, Writes). The token needs the read and insert comments capabilities, and
# user information including email addresses.
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

# The check's own profile allows documents.delete and the raw comment delete it also checks, so the trash steps run without a question; the file is in $work.
mkdir -p "$WCNOTION_CONFIG_DIR"
printf '%s\n' '{"profiles":{"live":{"permissions":{"documents.delete":"allow","api.delete-a-comment":"allow"}}}}' >"$WCNOTION_CONFIG_DIR/config.json"

"${cli[@]}" live session start --credential-storage file --json >/dev/null
made=""
# A check that fails half way still leaves its page in the trash, never in the workspace.
trap '[ -z "$made" ] || "${cli[@]}" live documents delete "$made" --json >/dev/null 2>&1 || true
  "${cli[@]}" live session end --json >/dev/null 2>&1 || true; rm -rf "$work"' EXIT

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
"${cli[@]}" live api get-self --json >"$work/self.json"
bot=$(node -e 'process.stdout.write(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).item.id)' \
  "$work/self.json")
"${cli[@]}" live api get-user --user-id "$bot" --json >"$work/user.json"
node -e '
  const read = (name) => JSON.parse(require("fs").readFileSync(`${process.argv[1]}/${name}.json`, "utf8")).item
  if (typeof read("user").name !== "string" || read("user").name !== read("self").name)
    throw new Error("users/{id} gave no name for the bot: the token needs user information capabilities")' "$work"
first=$(node -e 'const l = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); process.stdout.write(l.items[0]?.id ?? "")' "$work/list.json")
if [ -n "$first" ]; then
  "${cli[@]}" live databases show "$first" --json >"$work/database.json"
  # A read only: this database may be anywhere in the workspace, so no row is written to it.
  source=$(node -e 'const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); process.stdout.write(d.item.data_sources[0]?.id ?? "")' "$work/database.json")
  [ -z "$source" ] || "${cli[@]}" live rows list "$source" --limit 1 --json >/dev/null
fi
"${cli[@]}" live doctor --json >/dev/null

# One write round trip under the test page.
field() { node -e '
  const answer = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  const value = process.argv[2].split(".").reduce((one, key) => one?.[key], answer)
  if (value === undefined) throw new Error(`${process.argv[1]} has no ${process.argv[2]}`)
  process.stdout.write(String(value))' "$work/$1.json" "$2"; }
holds() { node -e '
  const page = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).item
  if (!page.markdown.includes(process.argv[2])) throw new Error(`documents get does not show ${process.argv[2]}`)' \
  "$work/$1.json" "$2"; }
stamp=$(date -u +%Y%m%dT%H%M%SZ)
"${cli[@]}" live documents create --parent "$page" --title "wirecat-live-$stamp" \
  --text "Written by the WireCat live check, first-$stamp" --json >"$work/created.json"
made=$(field created item.page.id)
[ "$(field created item.page.title)" = "wirecat-live-$stamp" ] || { echo "the new page has another title" >&2; exit 1; }
"${cli[@]}" live documents get "$made" --json >"$work/first.json"
holds first "first-$stamp"
"${cli[@]}" live documents update "$made" --text "Changed by the WireCat live check, second-$stamp" \
  --json >"$work/updated.json"
"${cli[@]}" live documents get "$made" --json >"$work/second.json"
holds second "second-$stamp"
"${cli[@]}" live documents create --parent "$made" --title "wirecat-live-child-$stamp" --json >/dev/null
if "${cli[@]}" live documents update "$made" --text "Drops the child, third-$stamp" --json \
  >/dev/null 2>"$work/dropped.json"; then
  echo "an update that drops a child page was not refused" >&2
  exit 1
fi
[ "$(field dropped error.reason)" = "notion.text-refused" ] || { echo "the refusal is not notion.text-refused" >&2; exit 1; }
"${cli[@]}" live documents get "$made" --json >"$work/kept.json"
holds kept "second-$stamp"
"${cli[@]}" live comments create "$made" --text "WireCat live check comment, $stamp" --json >"$work/commented.json"
discussion=$(field commented item.comment.discussion_id)
"${cli[@]}" live comments reply "$discussion" --text "WireCat live check reply, $stamp" --json >/dev/null
"${cli[@]}" live comments list "$made" --json >"$work/comments.json"
node -e '
  const answer = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  const thread = answer.items.filter((one) => one.discussion_id === process.argv[2])
  if (thread.length !== 2) throw new Error(`comments list shows ${thread.length} comments in the discussion, not 2`)' \
  "$work/comments.json" "$discussion"
comment=$(field commented item.comment.id)
"${cli[@]}" live comments edit "$comment" --text "WireCat live check comment, edited $stamp" --json >"$work/edited.json"
[ "$(field edited item.previous_text)" = "WireCat live check comment, $stamp" ] ||
  { echo "comments edit did not answer the earlier text" >&2; exit 1; }
"${cli[@]}" live comments delete "$comment" --json >"$work/uncommented.json"
"${cli[@]}" live comments list "$made" --json >"$work/comments-left.json"
node -e '
  const answer = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))
  if (answer.items.some((one) => one.id === process.argv[2])) throw new Error("comments delete left the comment")' \
  "$work/comments-left.json" "$comment"
"${cli[@]}" live documents rename "$made" "wirecat-live-renamed-$stamp" --json >"$work/renamed.json"
"${cli[@]}" live documents update "$made" --emoji "🧪" --cover none --json >/dev/null
[ "$(field renamed item.page.title)" = "wirecat-live-renamed-$stamp" ] || { echo "rename did not set the title" >&2; exit 1; }
"${cli[@]}" live documents create --parent "$page" --title "wirecat-live-target-$stamp" --json >"$work/target.json"
target=$(field target item.page.id)
"${cli[@]}" live documents move "$made" --parent "$target" --json >"$work/moved.json"
[ "$(field moved item.page.parent.id | tr -d -)" = "$(printf %s "$target" | tr -d -)" ] ||
  { echo "move did not put the page under the target" >&2; exit 1; }
"${cli[@]}" live documents move "$made" --parent "$page" --json >/dev/null
"${cli[@]}" live documents delete "$target" --json >/dev/null
printf 'Uploaded by the WireCat live check, %s\n' "$stamp" >"$work/wirecat-live-$stamp.txt"
"${cli[@]}" live files upload "$work/wirecat-live-$stamp.txt" --parent "$made" --json >"$work/uploaded.json"
[ "$(field uploaded item.upload.parts)" = "1" ] || { echo "a small file went in more than one part" >&2; exit 1; }
[ "$(field uploaded item.block.type)" = "file" ] || { echo "the text file was not added as a file block" >&2; exit 1; }
"${cli[@]}" live documents delete "$made" --json >"$work/trashed.json"
[ "$(field trashed item.page.in_trash)" = "true" ] || { echo "delete left the page out of the trash" >&2; exit 1; }
"${cli[@]}" live documents restore "$made" --json >"$work/restored.json"
[ "$(field restored item.page.in_trash)" = "false" ] || { echo "restore left the page in the trash" >&2; exit 1; }
"${cli[@]}" live documents delete "$made" --json >"$work/left.json"
[ "$(field left item.page.in_trash)" = "true" ] || { echo "the last delete left the page out of the trash" >&2; exit 1; }
made=""

"${cli[@]}" live session end --json >/dev/null
echo "live check passed: describe format 2, sign-in, users/me, the bot's name from users/{id}, databases list and show, documents get," \
  "a child_page block against its page, doctor, a page created, read, updated, refused, commented on, replied to," \
  "a comment edited and deleted, the page renamed, given an icon, moved and moved back," \
  "given a file, trashed and restored under the test page and left in the trash, sign-out"
