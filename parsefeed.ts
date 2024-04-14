import {
  DOMParser,
  Element,
} from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
import { uuidv7 } from "npm:uuidv7@^0.6.3";
import { removeCDATA, stripHTML } from "./striphtml.ts";
import { Temporal } from "npm:@js-temporal/polyfill";

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

function convertToDate(dateStr: string): Date {
  // Define months mapping from short month name to month number (0-based index as expected by JavaScript Date)

  // Regular expression to extract date components
  const months: { [key: string]: number } = {
    Jan: 0,
    Feb: 1,
    Mar: 2,
    Apr: 3,
    May: 4,
    Jun: 5,
    Jul: 6,
    Aug: 7,
    Sep: 8,
    Oct: 9,
    Nov: 10,
    Dec: 11,
  };

  const regex =
    /^...,\s+(\d{2})\s+(\w{3})\s+(\d{4})\s+(\d{2}):(\d{2}):(\d{2})\s+GMT$/;
  const matches = dateStr.match(regex);

  if (!matches) {
    throw new Error("Invalid date format");
  }

  const day = parseInt(matches[1], 10);
  const month = months[matches[2]];
  const year = parseInt(matches[3], 10);
  const hour = parseInt(matches[4], 10);
  const minute = parseInt(matches[5], 10);
  const second = parseInt(matches[6], 10);

  if (month === undefined) {
    throw new Error("Invalid month");
  }

  // Create a Date object from extracted components
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

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
    const targetDate = Temporal.Instant.from("2024-04-12T00:00:00Z");
    const currentDate = Temporal.Now.instant();
    const pubTemporal = Temporal.Instant.from(
      new Date(convertToDate(pubDate)).toISOString()
    );
    const published =
      Temporal.Instant.compare(pubTemporal, targetDate) < 0
        ? currentDate
        : pubTemporal;

    console.log(published.toString());

    all.push({
      published,
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
