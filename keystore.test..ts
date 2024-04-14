import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { parsefeed } from "./parsefeed.ts";
import { keystore } from "./keystore.ts";

Deno.test("keystore should store rss", async () => {
  const xml = await Deno.readTextFile("./rss.xml");
  const feed = await parsefeed(xml);
  const kv = await new Deno.Kv();
  const store = await keystore(kv, "feed");
  await store.wipe();
  await Promise.all(feed.map(store.ensure));
  const i = await store.items();
  assertEquals(feed.length, 10);
  assertEquals(i.length, 10);
  kv.close();
});
