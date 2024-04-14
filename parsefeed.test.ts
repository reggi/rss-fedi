import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { parsefeed } from "./parsefeed.ts";

Deno.test("fetchfeed should parse RSS feed correctly", async () => {
  const xml = await Deno.readTextFile("./rss.xml");
  const feed = await parsefeed(xml);

  assertEquals(feed.length, 10);
  assertEquals("id" in feed[0], true);
  assertEquals("pubDate" in feed[0], true);
  assertEquals("title" in feed[0], true);
  assertEquals("description" in feed[0], true);
});
