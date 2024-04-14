/// <reference lib="deno.unstable" />

import { Temporal } from "npm:@js-temporal/polyfill";
import { handle } from "./env.ts";
import { title } from "./env.ts";
import { description } from "./env.ts";
import { published } from "./env.ts";

interface BlogBase {
  handle: string;
  title: string;
  description: string;
}

export interface BlogInput extends BlogBase {
  handle: string;
  title: string;
  description: string;
}

export interface Blog extends BlogBase {
  published: Temporal.Instant;
}

// Static blog data used in the getBlog stub function
const staticBlogData: Blog = {
  handle: handle,
  title: title,
  description: description,
  published: Temporal.Instant.from(new Date(published).toISOString()),
};

// Stubbed getBlog function - returns static data
export async function getBlog(): Promise<Blog> {
  return staticBlogData;
}
