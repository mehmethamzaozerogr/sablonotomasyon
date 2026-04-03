"use client";

import { useEffect, useRef, useState } from "react";
import type { PreviewMode } from "@/types/template";

type PreviewIframeProps = {
  /** Compiled HTML document to render. */
  html: string;
  /** Zoom level as a percentage (50-150). */
  zoom: number;
  /** Increment this to force the iframe to remount and re-render. */
  refreshKey: number;
  /** Current preview mode to tune layout behavior. */
  mode?: PreviewMode;
};

/**
 * Renders compiled HTML in a sandboxed iframe with auto-height and zoom support.
 *
 * Isolation strategy:
 * - srcdoc prevents any network navigation
 * - sandbox="allow-same-origin" allows CSS parsing but blocks script execution,
 *   form submission, popups, and top-frame navigation
 */
export function PreviewIframe({
  html,
  zoom,
  refreshKey,
  mode = "desktop",
}: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [contentHeight, setContentHeight] = useState(
    mode === "print" ? 980 : 560,
  );

  const fallbackHeight = mode === "print" ? 980 : mode === "mobile" ? 680 : 560;

  // Measure content height after load so the container can match it
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const measure = () => {
      try {
        const doc = iframe.contentDocument;
        if (doc?.documentElement) {
          const h = doc.documentElement.scrollHeight;
          setContentHeight(h > 0 ? h + 24 : fallbackHeight);
        }
      } catch {
        // Cross-origin guard - should not happen with srcdoc but be safe
        setContentHeight(fallbackHeight);
      }
    };

    iframe.addEventListener("load", measure);
    // Fallback: when srcDoc changes without a key change, the load event may
    // have already fired before this effect ran. Re-measure after a short delay.
    const fallback = setTimeout(measure, 80);
    return () => {
      iframe.removeEventListener("load", measure);
      clearTimeout(fallback);
    };
  }, [fallbackHeight, html, refreshKey]);

  const scale = zoom / 100;

  // The outer div reserves vertical space for the scaled content
  // so surrounding layout doesn't collapse when zoom < 100
  const scaledHeight = Math.round(contentHeight * scale);

  return (
    <div
      style={{ height: scaledHeight, overflow: "hidden", position: "relative" }}
    >
      <iframe
        key={`${refreshKey}-${zoom}-${mode}`}
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-same-origin"
        title="Sablon onizleme"
        style={{
          width: scale < 1 ? `${100 / scale}%` : "100%",
          height: contentHeight,
          border: "none",
          display: "block",
          transformOrigin: "top left",
          transform: scale !== 1 ? `scale(${scale})` : undefined,
        }}
      />
    </div>
  );
}
