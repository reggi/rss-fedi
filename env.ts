import { load } from "https://deno.land/std@0.222.1/dotenv/mod.ts";

const env = await load();

const envGet = (key: string): string => {
  const value = env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} not set`);
  }
  return value;
};

export const handle = envGet("FEED_HANDLE");
export const title = envGet("FEED_TITLE");
export const description = envGet("FEED_DESC");
export const published = envGet("FEED_PUBLISHED");
export const feedUrl = envGet("FEED_URL");
export const name = envGet("FEED_NAME");
export const summary = envGet("FEED_SUMMARY");
