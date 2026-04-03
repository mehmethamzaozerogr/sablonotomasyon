"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getBindingPathOptions } from "@/lib/bindings/introspection";
import {
  extractHtmlVarOccurrences,
  getCompatibleHtmlVarOptions,
  type HtmlVarReplacementOption,
  type HtmlVarOccurrence,
  type HtmlVarKind,
} from "@/lib/bindings/html-vars";
import type {
  CanvasOccurrencePickerOverlay,
  CanvasOverlayRect,
  CanvasToolbarOverlay,
} from "@/lib/editor/canvas-overlay";
import {
  getCustomHtmlTextRegionsWithFallback,
  type HtmlTextRegion,
} from "@/lib/editor/custom-html-text";
import { sanitizeCustomHtmlForApp } from "@/lib/security/sanitize-custom-html";
import type { EditorMode } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

type CustomHtmlCanvasProps = {
  html: string;
  rawHtml?: string;
  sourceData: unknown;
  className?: string;
  rowMode?: boolean;
  editorMode?: EditorMode;
  activeOccurrenceId?: string | null;
  activeTextRegionId?: string | null;
  onSelectOccurrence?: (occurrence: HtmlVarOccurrence) => void;
  onReplaceOccurrence?: (occurrenceId: string, newPath: string) => void;
  onSelectTextRegion?: (region: HtmlTextRegion) => void;
  onEditTextRegion?: (region: HtmlTextRegion) => void;
  onInsertVariable?: (path: string) => void;
  onStyleTextRegion?: (region: HtmlTextRegion) => void;
  onToolbarOverlayChange?: (overlay: CanvasToolbarOverlay | null) => void;
  onOccurrencePickerOverlayChange?: (
    overlay: CanvasOccurrencePickerOverlay | null,
  ) => void;
};

const TOKEN_KIND_STYLES: Record<HtmlVarKind, { base: string; active: string }> =
  {
    variable: {
      base: "bg-sky-100/80 text-sky-800 hover:bg-sky-200",
      active:
        "bg-primary/12 text-primary shadow-[inset_0_0_0_1px_rgba(59,130,246,0.18)]",
    },
    if: {
      base: "bg-amber-100/80 text-amber-800 hover:bg-amber-200",
      active:
        "bg-amber-200 text-amber-900 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.25)]",
    },
    elseif: {
      base: "bg-amber-100/80 text-amber-800 hover:bg-amber-200",
      active:
        "bg-amber-200 text-amber-900 shadow-[inset_0_0_0_1px_rgba(217,119,6,0.25)]",
    },
    else: {
      base: "bg-gray-200/80 text-gray-700 hover:bg-gray-300",
      active:
        "bg-gray-300 text-gray-900 shadow-[inset_0_0_0_1px_rgba(107,114,128,0.25)]",
    },
    end: {
      base: "bg-gray-200/80 text-gray-700 hover:bg-gray-300",
      active:
        "bg-gray-300 text-gray-900 shadow-[inset_0_0_0_1px_rgba(107,114,128,0.25)]",
    },
    for: {
      base: "bg-violet-100/80 text-violet-800 hover:bg-violet-200",
      active:
        "bg-violet-200 text-violet-900 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]",
    },
    expression: {
      base: "bg-teal-100/80 text-teal-800 hover:bg-teal-200",
      active:
        "bg-teal-200 text-teal-900 shadow-[inset_0_0_0_1px_rgba(20,184,166,0.25)]",
    },
  };

function getTokenButtonClass(active: boolean, kind: HtmlVarKind = "variable") {
  const styles = TOKEN_KIND_STYLES[kind];
  return cn(
    "cursor-pointer rounded px-1 py-0.5 font-mono text-[0.92em] transition-colors",
    active ? styles.active : styles.base,
  );
}

function getElementByPath(root: HTMLElement, path: number[]) {
  let current: Element | null = root;
  for (const index of path) {
    current = current?.children.item(index) ?? null;
    if (!current) {
      return null;
    }
  }
  return current instanceof HTMLElement ? current : null;
}

function toOverlayRect(rect: DOMRect): CanvasOverlayRect {
  return {
    top: rect.top,
    left: rect.left,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  };
}

export function CustomHtmlCanvas({
  html,
  rawHtml,
  sourceData,
  className,
  rowMode = false,
  editorMode = "select",
  activeOccurrenceId,
  activeTextRegionId,
  onSelectOccurrence,
  onReplaceOccurrence,
  onSelectTextRegion,
  onEditTextRegion,
  onInsertVariable,
  onStyleTextRegion,
  onToolbarOverlayChange,
  onOccurrencePickerOverlayChange,
}: CustomHtmlCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);
  const onReplaceOccurrenceRef = useRef(onReplaceOccurrence);
  const onEditTextRegionRef = useRef(onEditTextRegion);
  const onInsertVariableRef = useRef(onInsertVariable);
  const onStyleTextRegionRef = useRef(onStyleTextRegion);
  const [pickerOccurrenceId, setPickerOccurrenceId] = useState<string | null>(
    null,
  );
  const [hoveredTextRegionId, setHoveredTextRegionId] = useState<string | null>(
    null,
  );
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [toolbarVariablePickerOpen, setToolbarVariablePickerOpen] =
    useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [focusedTextRegionId, setFocusedTextRegionId] = useState<string | null>(
    null,
  );

  const setDivContentRef = useCallback((node: HTMLDivElement | null) => {
    contentRef.current = node;
  }, []);

  const setTbodyContentRef = useCallback(
    (node: HTMLTableSectionElement | null) => {
      contentRef.current = node;
    },
    [],
  );

  const safeHtml = useMemo(() => sanitizeCustomHtmlForApp(html), [html]);
  const rawHtmlSource = useMemo(() => rawHtml ?? html, [html, rawHtml]);
  const occurrences = useMemo(
    () => extractHtmlVarOccurrences(rawHtmlSource),
    [rawHtmlSource],
  );
  const textRegions = useMemo(
    () =>
      getCustomHtmlTextRegionsWithFallback(safeHtml, rawHtmlSource, rowMode),
    [safeHtml, rawHtmlSource, rowMode],
  );
  const activeOccurrence = useMemo(
    () =>
      occurrences.find(
        (occurrence) =>
          occurrence.id === (pickerOccurrenceId ?? activeOccurrenceId),
      ) ?? null,
    [occurrences, pickerOccurrenceId, activeOccurrenceId],
  );
  const compatibleOptions = useMemo(
    () =>
      activeOccurrence
        ? getCompatibleHtmlVarOptions(sourceData, activeOccurrence)
        : [],
    [sourceData, activeOccurrence],
  );
  const insertVariableOptions = useMemo<HtmlVarReplacementOption[]>(
    () =>
      getBindingPathOptions(sourceData)
        .filter((option) => option.kind !== "array" && option.kind !== "object")
        .map((option) => ({
          replacePath: option.path,
          displayPath: option.displayPath,
          label: option.label,
          description: option.description,
          group: option.group,
          sample: option.sample,
          kind: option.kind,
          searchText: option.searchText,
        })),
    [sourceData],
  );
  const activeTextRegion = useMemo(
    () =>
      textRegions.find((region) => region.id === activeTextRegionId) ?? null,
    [activeTextRegionId, textRegions],
  );
  const allowHoverState = editorMode === "select" && !activeTextRegionId;

  useEffect(() => {
    onReplaceOccurrenceRef.current = onReplaceOccurrence;
  }, [onReplaceOccurrence]);

  useEffect(() => {
    onEditTextRegionRef.current = onEditTextRegion;
  }, [onEditTextRegion]);

  useEffect(() => {
    onInsertVariableRef.current = onInsertVariable;
  }, [onInsertVariable]);

  useEffect(() => {
    onStyleTextRegionRef.current = onStyleTextRegion;
  }, [onStyleTextRegion]);

  useEffect(() => {
    if (!pickerOccurrenceId) return;
    if (activeOccurrenceId && activeOccurrenceId !== pickerOccurrenceId) {
      setPickerOccurrenceId(null);
    }
  }, [activeOccurrenceId, pickerOccurrenceId]);

  useEffect(() => {
    setToolbarVariablePickerOpen(false);
    setMoreMenuOpen(false);
  }, [activeTextRegionId]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    content.innerHTML = safeHtml;

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent || !node.textContent.includes("{{")) {
          return NodeFilter.FILTER_REJECT;
        }

        const parentTag = node.parentElement?.tagName;
        if (parentTag && ["SCRIPT", "STYLE", "TEXTAREA"].includes(parentTag)) {
          return NodeFilter.FILTER_REJECT;
        }

        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }

    const allScribanRe = /\{\{[\s\S]*?\}\}/g;
    const usedOccurrenceIds = new Set<string>();

    function findOccurrenceForMatch(
      matchedText: string,
    ): HtmlVarOccurrence | null {
      const normalizedMatch = matchedText.replace(/\s+/g, " ");

      for (const occurrence of occurrences) {
        if (usedOccurrenceIds.has(occurrence.id)) continue;
        if (occurrence.matchText === matchedText) {
          usedOccurrenceIds.add(occurrence.id);
          return occurrence;
        }
      }

      for (const occurrence of occurrences) {
        if (usedOccurrenceIds.has(occurrence.id)) continue;
        if (occurrence.matchText.replace(/\s+/g, " ") === normalizedMatch) {
          usedOccurrenceIds.add(occurrence.id);
          return occurrence;
        }
      }

      return null;
    }

    for (const textNode of textNodes) {
      const text = textNode.textContent ?? "";
      allScribanRe.lastIndex = 0;

      let lastIndex = 0;
      let changed = false;
      let match = allScribanRe.exec(text);
      if (!match) continue;

      const fragment = document.createDocumentFragment();

      while (match) {
        const matchedText = match[0];
        const occurrence = findOccurrenceForMatch(matchedText);

        if (!occurrence) {
          if (match.index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, match.index)),
            );
          }
          const span = document.createElement("span");
          span.textContent = matchedText;
          span.className = getTokenButtonClass(false, "expression");
          fragment.appendChild(span);
          lastIndex = match.index + matchedText.length;
          changed = true;
          match = allScribanRe.exec(text);
          continue;
        }

        changed = true;

        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index)),
          );
        }

        const button = document.createElement("button");
        button.type = "button";
        button.tabIndex = -1;
        button.textContent = matchedText;
        button.dataset.varOccurrenceId = occurrence.id;
        button.dataset.varKind = occurrence.kind;
        const isActive =
          occurrence.id === activeOccurrenceId ||
          occurrence.id === pickerOccurrenceId;
        button.className = getTokenButtonClass(isActive, occurrence.kind);
        button.title =
          occurrence.kind === "variable"
            ? occurrence.path
            : occurrence.embeddedVarPaths?.length
              ? `${occurrence.kind}: ${occurrence.embeddedVarPaths.join(", ")}`
              : occurrence.kind;
        fragment.appendChild(button);

        lastIndex = match.index + matchedText.length;
        match = allScribanRe.exec(text);
      }

      if (!changed) continue;

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      textNode.parentNode?.replaceChild(fragment, textNode);
    }

    for (const region of textRegions) {
      const element = getElementByPath(content, region.path);
      if (!element) continue;

      element.dataset.textRegionId = region.id;
      element.classList.add("canvas-text-region");
      element.tabIndex = 0;
      element.setAttribute("role", "button");
      element.setAttribute("aria-label", region.label);
      element.title = region.label;
    }
  }, [
    activeOccurrenceId,
    occurrences,
    pickerOccurrenceId,
    safeHtml,
    textRegions,
  ]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    for (const region of textRegions) {
      const element = getElementByPath(content, region.path);
      if (!element) continue;
      element.classList.toggle("is-active", region.id === activeTextRegionId);
      element.classList.toggle(
        "is-editing",
        region.id === activeTextRegionId && editorMode === "edit-content",
      );
      element.classList.toggle("is-focused", region.id === focusedTextRegionId);
      element.classList.toggle(
        "is-hovered",
        allowHoverState && region.id === hoveredTextRegionId,
      );
    }
  }, [
    activeTextRegionId,
    allowHoverState,
    editorMode,
    focusedTextRegionId,
    hoveredTextRegionId,
    textRegions,
  ]);

  useEffect(() => {
    if (!onOccurrencePickerOverlayChange) return;
    if (
      !pickerOccurrenceId ||
      !wrapperRef.current ||
      !activeOccurrence ||
      !onReplaceOccurrenceRef.current
    ) {
      onOccurrencePickerOverlayChange(null);
      return;
    }

    const updateOverlay = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper) {
        onOccurrencePickerOverlayChange(null);
        return;
      }

      const token = wrapper.querySelector<HTMLElement>(
        `[data-var-occurrence-id="${pickerOccurrenceId}"]`,
      );
      if (!token) {
        setPickerOccurrenceId(null);
        onOccurrencePickerOverlayChange(null);
        return;
      }

      onOccurrencePickerOverlayChange({
        anchorRect: toOverlayRect(token.getBoundingClientRect()),
        occurrence: activeOccurrence,
        options: compatibleOptions,
        onSelect: (newPath) => {
          onReplaceOccurrenceRef.current?.(activeOccurrence.id, newPath);
          setPickerOccurrenceId(null);
        },
        onClose: () => setPickerOccurrenceId(null),
      });
    };

    updateOverlay();
    window.addEventListener("resize", updateOverlay);
    window.addEventListener("scroll", updateOverlay, true);

    return () => {
      window.removeEventListener("resize", updateOverlay);
      window.removeEventListener("scroll", updateOverlay, true);
      onOccurrencePickerOverlayChange(null);
    };
  }, [
    activeOccurrence,
    compatibleOptions,
    onOccurrencePickerOverlayChange,
    pickerOccurrenceId,
  ]);

  useEffect(() => {
    if (!activeTextRegionId) {
      setToolbarVisible(false);
      return;
    }

    setToolbarVisible(false);
    const animationFrame = window.requestAnimationFrame(() => {
      setToolbarVisible(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [activeTextRegionId]);

  useEffect(() => {
    if (!onToolbarOverlayChange) return;
    if (!activeTextRegionId || !activeTextRegion) {
      onToolbarOverlayChange(null);
      return;
    }

    const updateOverlay = () => {
      const wrapper = wrapperRef.current;
      if (!wrapper || !activeTextRegion) {
        onToolbarOverlayChange(null);
        return;
      }

      const regionElement = wrapper.querySelector<HTMLElement>(
        `[data-text-region-id="${activeTextRegionId}"]`,
      );
      if (!regionElement) {
        onToolbarOverlayChange(null);
        return;
      }

      onToolbarOverlayChange({
        anchorRect: toOverlayRect(regionElement.getBoundingClientRect()),
        region: activeTextRegion,
        visible: toolbarVisible,
        variablePickerOpen: toolbarVariablePickerOpen,
        moreMenuOpen,
        insertVariableOptions,
        onEdit: () => {
          if (activeTextRegion.readonly) return;
          setToolbarVariablePickerOpen(false);
          setMoreMenuOpen(false);
          onEditTextRegionRef.current?.(activeTextRegion);
        },
        onToggleVariablePicker: () => {
          if (
            activeTextRegion.readonly ||
            !activeTextRegion.supportsStructuredEditing
          ) {
            return;
          }
          setPickerOccurrenceId(null);
          setMoreMenuOpen(false);
          setToolbarVariablePickerOpen((current) => !current);
        },
        onCloseVariablePicker: () => setToolbarVariablePickerOpen(false),
        onSelectVariable: (path) => {
          if (activeTextRegion.readonly) return;
          onInsertVariableRef.current?.(path);
          setToolbarVariablePickerOpen(false);
        },
        onStyle: () => {
          if (activeTextRegion.readonly) return;
          setToolbarVariablePickerOpen(false);
          setMoreMenuOpen(false);
          onStyleTextRegionRef.current?.(activeTextRegion);
        },
        onToggleMore: () => {
          setPickerOccurrenceId(null);
          setToolbarVariablePickerOpen(false);
          setMoreMenuOpen((current) => !current);
        },
        onCloseMore: () => setMoreMenuOpen(false),
      });
    };

    updateOverlay();
    window.addEventListener("resize", updateOverlay);
    window.addEventListener("scroll", updateOverlay, true);

    return () => {
      window.removeEventListener("resize", updateOverlay);
      window.removeEventListener("scroll", updateOverlay, true);
      onToolbarOverlayChange(null);
    };
  }, [
    activeTextRegion,
    activeTextRegionId,
    insertVariableOptions,
    moreMenuOpen,
    onToolbarOverlayChange,
    toolbarVariablePickerOpen,
    toolbarVisible,
  ]);

  const focusRegionByIndex = useCallback(
    (index: number) => {
      if (!wrapperRef.current || textRegions.length === 0) {
        return;
      }

      const normalizedIndex =
        ((index % textRegions.length) + textRegions.length) %
        textRegions.length;
      const regionId = textRegions[normalizedIndex]?.id;
      if (!regionId) {
        return;
      }

      const regionElement = wrapperRef.current.querySelector<HTMLElement>(
        `[data-text-region-id="${regionId}"]`,
      );
      regionElement?.focus();
      regionElement?.scrollIntoView({ block: "nearest", inline: "nearest" });
    },
    [textRegions],
  );

  return (
    <div
      ref={wrapperRef}
      className={cn("relative", className)}
      onFocus={(event) => {
        const target = event.target as HTMLElement;
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );
        if (!regionElement) return;

        const regionId = regionElement.dataset.textRegionId ?? null;
        setFocusedTextRegionId(regionId);

        const region = textRegions.find((entry) => entry.id === regionId);
        if (region) {
          onSelectTextRegion?.(region);
        }
      }}
      onBlur={(event) => {
        const target = event.target as HTMLElement;
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );
        if (!regionElement) return;

        const nextTarget = event.relatedTarget as HTMLElement | null;
        if (
          nextTarget?.closest(
            `[data-text-region-id="${regionElement.dataset.textRegionId ?? ""}"]`,
          )
        ) {
          return;
        }

        setFocusedTextRegionId((current) =>
          current === (regionElement.dataset.textRegionId ?? null)
            ? null
            : current,
        );
      }}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement;
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );
        if (!regionElement) return;

        const regionId = regionElement.dataset.textRegionId;
        if (!regionId) return;

        const regionIndex = textRegions.findIndex(
          (entry) => entry.id === regionId,
        );
        if (regionIndex === -1) return;

        if (event.key === "Tab") {
          event.preventDefault();
          focusRegionByIndex(
            event.shiftKey ? regionIndex - 1 : regionIndex + 1,
          );
          return;
        }

        if (event.key === "Enter") {
          const region = textRegions[regionIndex];
          if (!region || region.readonly) return;
          event.preventDefault();
          onEditTextRegion?.(region);
          return;
        }

        if (event.key === "Escape" && editorMode !== "select") {
          const region = textRegions[regionIndex];
          if (!region) return;
          event.preventDefault();
          onSelectTextRegion?.(region);
          regionElement.focus();
        }
      }}
      onMouseMove={(event) => {
        if (!allowHoverState) {
          setHoveredTextRegionId(null);
          return;
        }
        const target = event.target as HTMLElement;
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );
        setHoveredTextRegionId(regionElement?.dataset.textRegionId ?? null);
      }}
      onMouseLeave={() => setHoveredTextRegionId(null)}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        const token = target.closest<HTMLElement>("[data-var-occurrence-id]");
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );

        if (regionElement) {
          const region = textRegions.find(
            (entry) => entry.id === regionElement.dataset.textRegionId,
          );
          if (region) {
            event.stopPropagation();
            setToolbarVariablePickerOpen(false);
            setMoreMenuOpen(false);
            onSelectTextRegion?.(region);
          }
        }

        if (!token) {
          setPickerOccurrenceId(null);
          setToolbarVariablePickerOpen(false);
          setMoreMenuOpen(false);
          return;
        }

        event.stopPropagation();
        setToolbarVariablePickerOpen(false);
        setMoreMenuOpen(false);

        const occurrence = occurrences.find(
          (entry) => entry.id === token.dataset.varOccurrenceId,
        );
        if (!occurrence) return;

        onSelectOccurrence?.(occurrence);

        if (occurrence.kind === "variable") {
          setPickerOccurrenceId(occurrence.id);
        } else {
          setPickerOccurrenceId(null);
        }
      }}
      onDoubleClick={(event) => {
        const target = event.target as HTMLElement;
        const regionElement = target.closest<HTMLElement>(
          "[data-text-region-id]",
        );
        if (!regionElement) return;

        const region = textRegions.find(
          (entry) => entry.id === regionElement.dataset.textRegionId,
        );
        if (!region || region.readonly) return;

        event.stopPropagation();
        onEditTextRegion?.(region);
      }}
    >
      {rowMode ? (
        <table
          className="w-full border-collapse"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
        >
          <tbody ref={setTbodyContentRef} />
        </table>
      ) : (
        <div
          ref={setDivContentRef}
          className="pointer-events-auto w-full overflow-hidden"
        />
      )}

      <style jsx global>{`
        .canvas-text-region.is-focused {
          outline-color: rgba(59, 130, 246, 0.92);
          box-shadow:
            0 0 0 4px rgba(59, 130, 246, 0.16),
            0 12px 24px -22px rgba(59, 130, 246, 0.8);
          background-color: rgba(59, 130, 246, 0.08);
        }
      `}</style>
    </div>
  );
}
