import { Post } from "./parsefeed.ts";

export function keystore<T extends Post = Post>(kv: Deno.Kv, key: string) {
  const itemKey = (item: any) => [key, item.pubDate.getTime(), item.id];
  return {
    kv,
    async wipe() {
      const entries = kv.list<T>({ prefix: [key] });
      for await (const entry of entries) {
        kv.delete(entry.key);
      }
    },
    async ensure(item: T) {
      const has = await kv.get<T>(itemKey(item));
      if (has.value) return has;
      return await kv.set(itemKey(item), item);
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
      const record = await kv.get([key]);
      return (record.value as bigint | null) ?? 0n;
    },
  };
}
