import { expect, it } from "vitest"
import { FAKE_TOKEN, fakeNotion } from "../testing/fake-notion.js"
import { notionClient } from "./client.js"
import { notionClock, notionPort } from "./port.js"

const NOTION_DATE = "Sat, 14 Nov 2026 10:00:30 GMT"

it("reports Notion's clock from the Date header of its latest answer, and none before the first", async () => {
  const notion = fakeNotion()
  // HTTP dates (RFC 9110): Notion's answers carry one; the fake adds it here.
  const dated: typeof notion.fetch = async (input, init) => {
    const answer = await notion.fetch(input, init)
    const headers = new Headers(answer.headers)
    headers.set("date", NOTION_DATE)
    return new Response(answer.body, { status: answer.status, headers })
  }
  const clock = notionClock()
  const port = notionPort(notionClient({ token: FAKE_TOKEN, fetch: dated, onAnswer: clock.observe }), clock)
  expect(port.serverTime?.()).toBeUndefined()
  await port.self()
  expect(port.serverTime?.()).toBe(Date.parse(NOTION_DATE))
})

it("keeps the last good time when an answer has no Date header, and has no clock when none is given", async () => {
  const clock = notionClock()
  clock.observe(new Response(null, { headers: { date: NOTION_DATE } }))
  clock.observe(new Response(null, { headers: { date: "not a date" } }))
  clock.observe(new Response(null))
  expect(clock.time()).toBe(Date.parse(NOTION_DATE))
  expect(notionPort(notionClient({ token: FAKE_TOKEN })).serverTime).toBeUndefined()
})
