"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type IsolatedHtmlFrameProps = {
  html: string;
  className?: string;
  minHeight?: number;
  title?: string;
};

export function IsolatedHtmlFrame({
  html,
  className,
  minHeight = 160,
  title = "Custom HTML preview",
}: IsolatedHtmlFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [contentHeight, setContentHeight] = useState(minHeight);

  const srcDoc = useMemo(
    () => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; background: #ffffff; }
      body { color: #0f172a; font: 14px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; }
      img { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>${html}</body>
</html>`,
    [html],
  );

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        const nextHeight = doc?.documentElement?.scrollHeight ?? minHeight;
        setContentHeight(Math.max(minHeight, nextHeight));
      } catch {
        setContentHeight(minHeight);
      }
    };

    iframe.addEventListener("load", measure);
    const fallback = window.setTimeout(measure, 80);

    return () => {
      iframe.removeEventListener("load", measure);
      window.clearTimeout(fallback);
    };
  }, [srcDoc, minHeight]);

  return (
    <iframe
      ref={iframeRef}
      title={title}
      srcDoc={srcDoc}
      sandbox="allow-same-origin"
      scrolling="no"
      className={className}
      style={{
        width: "100%",
        minHeight,
        height: contentHeight,
        border: "0",
        display: "block",
      }}
    />
  );
}
