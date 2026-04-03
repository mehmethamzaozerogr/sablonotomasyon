const DROP_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "link",
  "meta",
  "base",
]);

const DOWNGRADE_TAGS = new Set(["form", "button"]);

const TEXTIFY_TAGS = new Set(["input", "textarea", "select", "option"]);

const URL_ATTRIBUTES = new Set([
  "href",
  "src",
  "xlink:href",
  "formaction",
  "action",
  "poster",
]);

function isSafeUrl(value: string) {
  const url = value.trim().toLowerCase();
  if (!url) return true;
  if (url.startsWith("#")) return true;
  if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../"))
    return true;
  if (url.startsWith("http://") || url.startsWith("https://")) return true;
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return true;
  if (url.startsWith("cid:")) return true;

  // Keep image data URIs for email-template compatibility.
  if (url.startsWith("data:image/")) return true;

  return false;
}

function hasUnsafeCss(value: string) {
  const css = value.toLowerCase();
  return (
    css.includes("expression(") ||
    css.includes("javascript:") ||
    css.includes("vbscript:") ||
    css.includes("@import") ||
    css.includes("behavior:")
  );
}

function createInertPlaceholder(doc: Document, tagName: string) {
  const placeholder = doc.createElement("template");
  placeholder.setAttribute("data-sanitized-tag", tagName);
  return placeholder;
}

function createDowngradedContainer(doc: Document, tagName: string) {
  const container = doc.createElement(tagName === "form" ? "div" : "span");
  container.setAttribute("data-sanitized-tag", tagName);
  return container;
}

function getTextifiedValue(element: Element, tagName: string) {
  if (tagName === "input") {
    return (
      element.getAttribute("value") ??
      element.getAttribute("placeholder") ??
      ""
    ).trim();
  }

  if (tagName === "select") {
    const selected = element.querySelector("option[selected]");
    if (selected?.textContent?.trim()) {
      return selected.textContent.trim();
    }
  }

  return (element.textContent ?? "").trim();
}

export function sanitizeCustomHtmlForApp(html: string) {
  if (!html.trim()) return "";
  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(
    `<div id="__safe-root">${html}</div>`,
    "text/html",
  );
  const root = doc.getElementById("__safe-root");
  if (!root) return html;

  const elements = Array.from(root.querySelectorAll("*"));

  for (const element of elements) {
    const tagName = element.tagName.toLowerCase();
    let currentElement: Element = element;

    if (DROP_TAGS.has(tagName)) {
      element.replaceWith(createInertPlaceholder(doc, tagName));
      continue;
    }

    if (DOWNGRADE_TAGS.has(tagName)) {
      const downgraded = createDowngradedContainer(doc, tagName);
      while (element.firstChild) {
        downgraded.appendChild(element.firstChild);
      }
      element.replaceWith(downgraded);
      currentElement = downgraded;
    } else if (TEXTIFY_TAGS.has(tagName)) {
      const textified = doc.createElement("span");
      textified.setAttribute("data-sanitized-tag", tagName);
      textified.textContent = getTextifiedValue(element, tagName);
      element.replaceWith(textified);
      currentElement = textified;
    }

    const attributes = Array.from(currentElement.attributes);
    for (const attribute of attributes) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value;

      if (name.startsWith("on")) {
        currentElement.removeAttribute(attribute.name);
        continue;
      }

      if (name === "srcdoc") {
        currentElement.removeAttribute(attribute.name);
        continue;
      }

      if (name === "style" && hasUnsafeCss(value)) {
        currentElement.removeAttribute(attribute.name);
        continue;
      }

      if (URL_ATTRIBUTES.has(name) && !isSafeUrl(value)) {
        currentElement.removeAttribute(attribute.name);
        continue;
      }
    }

    const target = currentElement.getAttribute("target");
    if (target && target.toLowerCase() === "_blank") {
      const currentRel = currentElement.getAttribute("rel") ?? "";
      const relParts = new Set(currentRel.split(/\s+/).filter(Boolean));
      relParts.add("noopener");
      relParts.add("noreferrer");
      currentElement.setAttribute("rel", Array.from(relParts).join(" "));
    }
  }

  return root.innerHTML;
}
