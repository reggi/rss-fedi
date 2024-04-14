import { assertEquals } from "https://deno.land/std@0.222.1/assert/mod.ts";
import { stripHTML } from "./striphtml.ts";

Deno.test("stripHTML should remove HTML tags and preserve new lines", () => {
  const html = `<![CDATA[<html><body> <p>Our next Event will be on Thu Dec 07 2023 00:00:00 GMT+0000 (Coordinated Universal Time)</p> <p>Be sure to RSVP on meetup <a href="https://www.meetup.com/astoria-tech-meetup/events/297194678/">Event Link on Meetup</a>.</p> </body></html>]]>`;

  const expected = [
    "Our next Event will be on Thu Dec 07 2023 00:00:00 GMT+0000 (Coordinated Universal Time)",
    "Be sure to RSVP on meetup https://www.meetup.com/astoria-tech-meetup/events/297194678/ (Event Link on Meetup).",
  ].join("\n");

  const result = stripHTML(html);
  assertEquals(result, expected);
});

Deno.test(
  "stripHTML should remove HTML tags and not include anchor text",
  () => {
    const html = `<![CDATA[<html><body> <p>Our next Event will be on Thu Dec 07 2023 00:00:00 GMT+0000 (Coordinated Universal Time)</p> <p>Be sure to RSVP on meetup <a href="https://www.meetup.com/astoria-tech-meetup/events/297194678/">Event Link on Meetup</a>.</p> </body></html>]]>`;

    const expected = [
      "Our next Event will be on Thu Dec 07 2023 00:00:00 GMT+0000 (Coordinated Universal Time)",
      "Be sure to RSVP on meetup https://www.meetup.com/astoria-tech-meetup/events/297194678/.",
    ].join("\n");

    const result = stripHTML(html, { includeAnchorText: false });
    assertEquals(result, expected);
  }
);
