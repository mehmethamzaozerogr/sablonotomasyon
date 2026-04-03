"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Lock, Plus, X } from "lucide-react";

import {
  createVariableSegment,
  normalizeInlineSegments,
  type InlineSegment,
} from "@/lib/editor/custom-html-text";
import { cn } from "@/lib/utils";

export type InlineSegmentEditorHandle = {
  focus: () => void;
  insertVariable: (path: string) => void;
};

type InlineSegmentEditorProps = {
  segments: InlineSegment[];
  onChange: (segments: InlineSegment[]) => void;
  autoFocusToken?: number;
  className?: string;
  onBlurWithin?: () => void;
};

type CaretState = {
  index: number;
  position: number;
};

type FocusPlacement = "start" | "end";

export const InlineSegmentEditor = forwardRef<InlineSegmentEditorHandle, InlineSegmentEditorProps>(
  function InlineSegmentEditor({ segments, onChange, autoFocusToken, className, onBlurWithin }, ref) {
    const textareaRefs = useRef<Record<number, HTMLTextAreaElement | null>>({});
    const [caretState, setCaretState] = useState<CaretState | null>(null);
    const [pendingFocusIndex, setPendingFocusIndex] = useState<number | null>(null);
    const [activeTokenIndex, setActiveTokenIndex] = useState<number | null>(null);

    const normalizedSegments = useMemo(() => normalizeInlineSegments(segments), [segments]);

    function resizeTextarea(node: HTMLTextAreaElement | null) {
      if (!node) return;
      node.style.height = "0px";
      node.style.height = `${Math.max(38, node.scrollHeight)}px`;
    }

    function focusTextSegment(index: number, placement: FocusPlacement = "end") {
      const target = textareaRefs.current[index];
      if (!target) return;
      target.focus();
      const position = placement === "start" ? 0 : target.value.length;
      target.setSelectionRange(position, position);
      setCaretState({ index, position });
      setActiveTokenIndex(null);
    }

    function focusInsertionPoint(segmentIndex: number) {
      const nextTextIndex = normalizedSegments.findIndex(
        (segment, index) => index >= segmentIndex && segment.type === "text",
      );
      if (nextTextIndex !== -1) {
        focusTextSegment(nextTextIndex, "start");
        return;
      }

      const previousTextIndex = normalizedSegments.findLastIndex(
        (segment, index) => index < segmentIndex && segment.type === "text",
      );
      if (previousTextIndex !== -1) {
        focusTextSegment(previousTextIndex, "end");
      }
    }

    useEffect(() => {
      Object.values(textareaRefs.current).forEach((node) => resizeTextarea(node));
    }, [normalizedSegments]);

    useEffect(() => {
      if (pendingFocusIndex === null) return;
      const target = textareaRefs.current[pendingFocusIndex];
      if (!target) return;
      target.focus();
      const length = target.value.length;
      target.setSelectionRange(length, length);
      setPendingFocusIndex(null);
      setCaretState({ index: pendingFocusIndex, position: length });
      setActiveTokenIndex(null);
    }, [pendingFocusIndex, normalizedSegments]);

    useEffect(() => {
      if (!autoFocusToken && autoFocusToken !== 0) return;
      const firstIndex = normalizedSegments.findIndex((segment) => segment.type === "text");
      if (firstIndex === -1) return;
      focusTextSegment(firstIndex, "end");
    }, [autoFocusToken, normalizedSegments]);

    useImperativeHandle(ref, () => ({
      focus() {
        const firstIndex = normalizedSegments.findIndex((segment) => segment.type === "text");
        if (firstIndex === -1) return;
        focusTextSegment(firstIndex, "end");
      },
      insertVariable(path: string) {
        const activeTextIndex =
          caretState?.index ?? normalizedSegments.findLastIndex((segment) => segment.type === "text");
        if (activeTextIndex < 0) {
          const next = normalizeInlineSegments([
            { type: "text", value: "" },
            createVariableSegment(path),
            { type: "text", value: "" },
          ]);
          onChange(next);
          setActiveTokenIndex(1);
          setPendingFocusIndex(next.length - 1);
          return;
        }

        const activeSegment = normalizedSegments[activeTextIndex];
        if (!activeSegment || activeSegment.type !== "text") {
          return;
        }

        const splitPosition = Math.max(
          0,
          Math.min(caretState?.position ?? activeSegment.value.length, activeSegment.value.length),
        );

        const before = activeSegment.value.slice(0, splitPosition);
        const after = activeSegment.value.slice(splitPosition);
        const next = normalizeInlineSegments([
          ...normalizedSegments.slice(0, activeTextIndex),
          { type: "text", value: before },
          createVariableSegment(path),
          { type: "text", value: after },
          ...normalizedSegments.slice(activeTextIndex + 1),
        ]);

        onChange(next);
        setActiveTokenIndex(activeTextIndex + 1);
        const insertedTextIndex = next.findIndex(
          (segment, index) =>
            index > activeTextIndex &&
            segment.type === "text" &&
            segment.value === after,
        );
        setPendingFocusIndex(insertedTextIndex === -1 ? activeTextIndex : insertedTextIndex);
      },
    }), [caretState, normalizedSegments, onChange]);

    return (
      <div
        className={cn("rounded-2xl border border-border bg-white p-3", className)}
        onBlurCapture={(event) => {
          const nextTarget = event.relatedTarget as HTMLElement | null;
          if (nextTarget && event.currentTarget.contains(nextTarget)) {
            return;
          }
          onBlurWithin?.();
        }}
      >
        <div className="flex flex-wrap items-start gap-2">
          {normalizedSegments.map((segment, index) => {
            const insertBefore = index > 0 ? (
              <button
                key={`insert-before-${index}`}
                type="button"
                onClick={() => focusInsertionPoint(index)}
                className="inline-flex min-h-[32px] items-center rounded-full border border-dashed border-sky-200 bg-sky-50/70 px-2.5 py-1 text-[11px] font-medium text-sky-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:shadow-[0_10px_20px_-18px_rgba(14,165,233,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                title="Select a variable from the picker to insert it here"
              >
                <Plus className="mr-1 h-3 w-3" />
                Insert variable
              </button>
            ) : null;

            if (segment.type === "text") {
              return (
                <div key={`text-wrap-${index}`} className="contents">
                  {insertBefore}
                  <textarea
                    ref={(node) => {
                      textareaRefs.current[index] = node;
                      resizeTextarea(node);
                    }}
                    value={segment.value}
                    onChange={(event) => {
                      const next = normalizedSegments.map((entry, entryIndex) =>
                        entryIndex === index && entry.type === "text"
                          ? { ...entry, value: event.target.value }
                          : entry,
                      );
                      onChange(normalizeInlineSegments(next));
                      resizeTextarea(event.target);
                    }}
                    onFocus={(event) => {
                      setActiveTokenIndex(null);
                      setCaretState({
                        index,
                        position: event.target.selectionStart ?? event.target.value.length,
                      });
                    }}
                    onClick={(event) =>
                      setCaretState({
                        index,
                        position: event.currentTarget.selectionStart ?? event.currentTarget.value.length,
                      })
                    }
                    onKeyUp={(event) =>
                      setCaretState({
                        index,
                        position: event.currentTarget.selectionStart ?? event.currentTarget.value.length,
                      })
                    }
                    onSelect={(event) =>
                      setCaretState({
                        index,
                        position: event.currentTarget.selectionStart ?? event.currentTarget.value.length,
                      })
                    }
                    placeholder="Metin yazin"
                    className="min-h-[38px] min-w-[120px] flex-1 resize-none rounded-xl border border-transparent bg-slate-50 px-3 py-2 text-sm leading-6 text-foreground outline-none transition focus:border-primary/30 focus:bg-white focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
                  />
                </div>
              );
            }

            if (segment.type === "variable") {
              return (
                <div key={`variable-wrap-${index}`} className="contents">
                  {insertBefore}
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setActiveTokenIndex(index)}
                    onFocus={() => setActiveTokenIndex(index)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveTokenIndex(index);
                      }
                    }}
                    className={cn(
                      "inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm text-sky-900 transition",
                      activeTokenIndex === index
                        ? "border-sky-400 bg-sky-100 shadow-[0_0_0_3px_rgba(14,165,233,0.18)]"
                        : "border-sky-200 bg-sky-50 shadow-[0_6px_18px_-18px_rgba(14,165,233,0.7)] hover:-translate-y-0.5 hover:bg-sky-100 hover:shadow-[0_14px_24px_-18px_rgba(14,165,233,0.8)]",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300",
                    )}
                    title="Variable token"
                  >
                    <span className="rounded-full bg-sky-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sky-700">
                      Variable
                    </span>
                    <span className="truncate font-mono text-[12px]">{segment.raw}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        const next = normalizedSegments.filter((_, entryIndex) => entryIndex !== index);
                        onChange(normalizeInlineSegments(next));
                        setActiveTokenIndex(null);
                      }}
                      className="shrink-0 rounded-full p-0.5 text-sky-500 transition hover:bg-sky-200 hover:text-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                      title="Degiskeni kaldir"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div key={`logic-wrap-${index}`} className="contents">
                {insertBefore}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setActiveTokenIndex(index)}
                  onFocus={() => setActiveTokenIndex(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveTokenIndex(index);
                    }
                  }}
                  className={cn(
                    "inline-flex min-h-[38px] max-w-full items-center gap-2 rounded-2xl border px-3 py-2 text-sm text-amber-950 transition",
                    activeTokenIndex === index
                      ? "border-amber-400 bg-amber-100 shadow-[0_0_0_3px_rgba(245,158,11,0.2)]"
                      : "border-amber-200 bg-amber-50 shadow-[0_6px_18px_-18px_rgba(245,158,11,0.7)] hover:-translate-y-0.5 hover:bg-amber-100 hover:shadow-[0_14px_24px_-18px_rgba(245,158,11,0.85)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300",
                  )}
                  title="Protected logic block"
                >
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  <span className="rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                    Logic
                  </span>
                  <span className="truncate font-mono text-[12px]">{segment.raw}</span>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => focusInsertionPoint(normalizedSegments.length)}
            className="inline-flex min-h-[32px] items-center rounded-full border border-dashed border-sky-200 bg-sky-50/70 px-2.5 py-1 text-[11px] font-medium text-sky-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 hover:shadow-[0_10px_20px_-18px_rgba(14,165,233,0.8)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            title="Select a variable from the picker to insert it here"
          >
            <Plus className="mr-1 h-3 w-3" />
            Insert variable
          </button>
        </div>
      </div>
    );
  },
);
