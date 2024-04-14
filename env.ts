const envGet = (key: string): string => {
  const value = Deno.env.get(key);
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
