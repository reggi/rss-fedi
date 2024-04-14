import {
  Accept,
  Federation,
  Endpoints,
  Follow,
  Person,
  Undo,
  exportJwk,
  generateCryptoKeyPair,
  importJwk,
  isActor,
  Create,
  Activity,
} from "./deps.ts";
import { DenoKvMessageQueue, DenoKvStore } from "./deps.ts";
import { keystore } from "./keystore.ts";
import { openKv } from "./kv.ts";
import { getBlog } from "./blog.ts";
import { getComments } from "./comment.ts";
import { Post } from "./parsefeed.ts";
import { toArticle } from "./article.ts";
import { parsefeed } from "./parsefeed.ts";
import { feedUrl } from "./env.ts";
import { name, summary, handle as accountHandle } from "./env.ts";

const kv = await openKv();
const {
  ensure,
  cursor: getPosts,
  count: countPosts,
} = await keystore<Post>(kv, "feed");

export const trigger = async () => {
  const feed = await fetch(feedUrl);
  const body = await feed.text();
  const parsedFeed = parsefeed(body);
  for (const post of parsedFeed) {
    await ensure(post);
  }
  return new Response("OK");
};

// A `Federation` object is the main entry point of the Fedify framework.
// It provides a set of methods to configure and run the federated server:
export const federation = new Federation<void>({
  kv: new DenoKvStore(kv),
  queue: new DenoKvMessageQueue(kv),
});

// Registers the actor dispatcher, which is responsible for creating a
// `Actor` object (`Person` in this case) for a given actor URI.
// The actor dispatch is not only used for the actor URI, but also for
// the WebFinger resource:
federation
  .setActorDispatcher("/users/{handle}", (ctx, handle, key) => {
    // In this demo, we're assuming that there is only one account for
    // this server: @demo@fedify-demo.deno.land
    if (handle != accountHandle) return null;
    return new Person({
      id: ctx.getActorUri(handle),
      name: name,
      summary: summary,
      preferredUsername: handle,
      url: new URL("/", ctx.url),
      inbox: ctx.getInboxUri(handle),
      endpoints: new Endpoints({
        sharedInbox: ctx.getInboxUri(),
      }),
      publicKey: key,
    });
  })
  .setKeyPairDispatcher(async (_, handle) => {
    if (handle != accountHandle) return null;
    const entry = await kv.get<{
      privateKey: JsonWebKey;
      publicKey: JsonWebKey;
    }>(["key"]);
    if (entry == null || entry.value == null) {
      // Generate a new key pair at the first time:
      const { privateKey, publicKey } = await generateCryptoKeyPair();
      // Store the generated key pair to the Deno KV database in JWK format:
      await kv.set(["key"], {
        privateKey: await exportJwk(privateKey),
        publicKey: await exportJwk(publicKey),
      });
      return { privateKey, publicKey };
    }
    // Load the key pair from the Deno KV database:
    const privateKey = await importJwk(entry.value.privateKey, "private");
    const publicKey = await importJwk(entry.value.publicKey, "public");
    return { privateKey, publicKey };
  });

// Registers the inbox listeners, which are responsible for handling
// incoming activities in the inbox:
federation
  .setInboxListeners("/users/{handle}/inbox", "/inbox")
  // The `Follow` activity is handled by adding the follower to the
  // follower list:
  .on(Follow, async (ctx, follow) => {
    if (
      follow.id == null ||
      follow.actorId == null ||
      follow.objectId == null
    ) {
      return;
    }
    const handle = ctx.getHandleFromActorUri(follow.objectId);
    if (handle != accountHandle) return;
    const follower = await follow.getActor(ctx);
    console.log(follower);
    if (!isActor(follower)) return;
    // Note that if a server receives a `Follow` activity, it should reply
    // with either an `Accept` or a `Reject` activity.  In this case, the
    // server automatically accepts the follow request:
    await ctx.sendActivity(
      { handle },
      follower,
      new Accept({ actor: follow.objectId, object: follow })
    );
    await kv.set(["followers", follow.id.href], follow.actorId.href);
  })
  // The `Undo` activity purposes to undo the previous activity.  In this
  // project, we use the `Undo` activity to represent someone unfollowing
  // this demo app:
  .on(Undo, async (ctx, undo) => {
    const activity = await undo.getObject(ctx); // An `Activity` to undo
    if (activity instanceof Follow) {
      if (activity.id == null) return;
      await kv.delete(["followers", activity.id.href]);
    } else {
      console.debug(undo);
    }
  });

federation.setFollowingDispatcher(
  "/users/{handle}/following",
  (_ctx, _handle, _cursor) => {
    return null;
  }
);

// Registers the outbox dispatcher, which is responsible for listing
// activities in the outbox:
// Registers the outbox dispatcher, which is responsible for listing
// activities in the outbox:
federation
  .setOutboxDispatcher(
    "/users/{handle}/outbox",
    async (ctx, handle, cursor) => {
      if (cursor == null) return null;
      const blog = await getBlog();
      if (blog == null) return null;
      else if (blog.handle !== handle) return null;
      const activities: Activity[] = [];
      const { posts, nextCursor } = await getPosts(
        undefined,
        // Treat the empty string as the first cursor:
        cursor === "" ? undefined : cursor
      );
      for await (const post of posts) {
        const comments = await getComments(post.uuid);
        const activity = new Create({
          id: new URL(`/posts/${post.uuid}#activity`, ctx.request.url),
          actor: ctx.getActorUri(handle),
          to: new URL("https://www.w3.org/ns/activitystreams#Public"),
          object: toArticle(ctx, blog, post, comments),
        });
        activities.push(activity);
      }
      return {
        items: activities,
        nextCursor,
      };
    }
  )
  // Registers the outbox counter, which is responsible for counting the
  // total number of activities in the outbox:
  .setCounter(async (_ctx, handle) => {
    const blog = await getBlog();
    if (blog == null) return null;
    else if (blog.handle !== handle) return null;
    return countPosts();
  })
  // Registers the first cursor.  The cursor value here is arbitrary, but
  // it must be parsable by the outbox dispatcher:
  .setFirstCursor(async (_ctx, handle) => {
    const blog = await getBlog();
    if (blog == null) return null;
    else if (blog.handle !== handle) return null;
    // Treat the empty string as the first cursor:
    return "";
  });
