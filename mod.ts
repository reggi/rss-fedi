import { banner, home } from "./banner.ts";
import { handle } from "./env.ts";
import { federation, trigger, wipe } from "./fedi.ts";
import { openKv } from "./kv.ts";

const kv = await openKv();

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  // The home page:

  console.log(url.pathname);

  if (url.pathname === "/trigger") {
    return await trigger();
  } else if (url.pathname === "/wipe") {
    return await wipe();
  } else if (url.pathname === "/") {
    const followers: string[] = [];
    for await (const entry of kv.list({ prefix: ["followers"] })) {
      if (typeof entry.value !== "string") continue;
      if (followers.includes(entry.value)) continue;
      followers.push(entry.value);
    }
    return new Response(home({ banner, handle, url, followers }));
  }
  // The `federation` object purposes to handle federation-related requests.
  // It is responsible for handling, for example, WebFinger queries, actor
  // dispatching, and incoming activities to the inbox:
  return await federation.handle(req, {
    // The context data is not used in this example, but it can be used to
    // store data (e.g., database connections) that is shared between
    // the different federation-related callbacks:
    contextData: undefined,
  });
});
