import { Post } from "./parsefeed.ts";
import { Temporal } from "npm:@js-temporal/polyfill@^0.4.4";

export function keystore<T extends Post = Post>(kv: Deno.Kv, key: string) {
  const itemKey = (item: any) => [key, item.pubDate.getTime(), item.id];
  return {
    kv,
    async wipe() {
      const entries = kv.list<T>({ prefix: [key] });
      for await (const entry of entries) {
        kv.delete(entry.key);
      }
      await kv.delete(["count"]);
    },
    async ensure(item: T) {
      const has = await kv.get<T>(itemKey(item));
      if (has.value) return { post: has, existed: true };
      const post = await kv
        .atomic()
        .set(itemKey(item), {
          ...item,
          published: item.published.toString(),
        })
        .sum(["count"], 1n)
        .commit();
      return { post, existed: false };
    },
    async items() {
      const items = await kv.list({ prefix: [key] });
      const posts = [];
      for await (const res of items) {
        posts.push(res.value);
      }
      return posts;
    },
    async cursor(limit = 5, cursor?: string) {
      const it = kv.list<T>(
        { prefix: [key] },
        {
          limit,
          cursor,
          reverse: true,
        }
      );
      const posts: T[] = [];
      for await (const entry of it) {
        posts.push({
          ...entry.value,
          published: Temporal.Instant.from(entry.value.published),
        });
      }
      return { posts, nextCursor: posts.length < limit ? null : it.cursor };
    },
    async count() {
      const record = await kv.get(["count"]);
      return (record.value as bigint | null) ?? 0n;
    },
  };
}
