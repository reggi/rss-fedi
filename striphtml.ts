import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

/// <reference lib="dom" />

export const removeCDATA = (html: string): string => {
  const strippedHtml = html.replace("<![CDATA[", "").replace("]]>", "");
  return strippedHtml;
};

export function stripHTML(
  html: string,
  options: { includeAnchorText: boolean } = { includeAnchorText: true }
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  if (doc === null) {
    throw new Error("Failed to parse the HTML content.");
  }

  // Handle <br> tags by replacing them with newline characters
  doc
    .querySelectorAll("br")
    .forEach((br) => br.parentNode?.replaceChild(doc.createTextNode("\n"), br));

  // Handle <p> tags by appending a newline after each paragraph's content
  doc.querySelectorAll("p").forEach((p) => {
    p.appendChild(doc.createTextNode("\n")); // Adds a newline after the paragraph content
  });

  // Convert <a> elements to "text (url)" format
  doc.querySelectorAll("a").forEach((a: any) => {
    const text = a.textContent || "";
    const href = a.getAttribute("href");
    const replacementText = href
      ? options.includeAnchorText
        ? `${href} (${text})`
        : href
      : text;
    a._replaceWith(doc.createTextNode(replacementText));
  });

  // Remove all other elements and replace them with their text content
  Array.from(doc.body.getElementsByTagName("*")).forEach((element) => {
    if (!["A", "BR", "P"].includes(element.tagName)) {
      const textNode = doc.createTextNode(element.textContent || "");
      element.replaceWith(textNode);
    }
  });

  // Extract and return the processed text
  return (doc.body.textContent || "")
    .trim()
    .replace(/\n+/g, "\n")
    .split("\n")
    .map((v) => v.trim())
    .join("\n");
}
