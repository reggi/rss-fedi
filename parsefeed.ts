import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { uuidv7 } from "npm:uuidv7@^0.6.3";
import { removeCDATA, stripHTML } from "./striphtml.ts";
import { type Temporal } from "npm:@js-temporal/polyfill";

/// <reference lib="dom" />

export type Post = {
  id: string;
  title: string;
  description: string;
  pubDate: Date;
  uuid: string;
  html: string;
  plain: string;
  published: Temporal.Instant;
};

export function parsefeed(xml: string): Post[] {
  const doc = new DOMParser().parseFromString(xml, "text/html");

  if (!doc) {
    throw new Error("Failed to parse the RSS feed.");
  }

  const items = doc.querySelectorAll("item");
  const all = [];
  for (const _item of items) {
    const item = _item as Element;
    const id =
      item.querySelector("guid")?.textContent ||
      item.querySelector("link")?.textContent;
    const title = item.querySelector("title")?.textContent;
    const descNode = item.querySelector("description");
    const description = descNode?.textContent;
    const html = removeCDATA(description || "");
    if (!descNode) {
      throw new Error("Failed to parse the description in the RSS feed.");
    }
    const plain = stripHTML(html);
    const pubDate = item.querySelector("pubDate")?.textContent;

    if (!pubDate)
      throw new Error("Failed to parse the pubDate in the RSS feed.");
    if (!id) throw new Error("Failed to parse the id in the RSS feed.");
    if (!title) throw new Error("Failed to parse the title in the RSS feed.");
    if (!description)
      throw new Error("Failed to parse the description in the RSS feed.");
    if (!pubDate)
      throw new Error("Failed to parse the pubDate in the RSS feed.");
    const uuid = uuidv7();
    all.push({
      published: Temporal.Instant.fromEpochMilliseconds(
        new Date(pubDate).getDate()
      ),
      uuid,
      id,
      title,
      description,
      pubDate: new Date(pubDate),
      html,
      plain,
    });
  }
  return all;
}
