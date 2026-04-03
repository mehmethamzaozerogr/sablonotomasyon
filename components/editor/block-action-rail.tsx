"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  GripVertical,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import { cn } from "@/lib/utils";

type MenuPosition = {
  top: number;
  left: number;
};

type BlockActionRailProps = {
  visible: boolean;
  compact: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  dragAttributes?: Record<string, unknown>;
  dragListeners?: Record<string, unknown>;
};

const MENU_WIDTH = 196;
const MENU_GAP = 10;

function clampPosition(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

const ActionButton = forwardRef<HTMLButtonElement, {
  title: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>>(function ActionButton(
  {
    title,
    disabled = false,
    active = false,
    onClick,
    children,
    className,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
        disabled
          ? "cursor-not-allowed opacity-35"
          : active
            ? "bg-white text-slate-900 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.24)]"
            : "hover:bg-white hover:text-slate-900",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

export function BlockActionRail({
  visible,
  compact,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
  dragAttributes,
  dragListeners,
}: BlockActionRailProps) {
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstMenuItemRef = useRef<HTMLButtonElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);

  const updateMenuPosition = useCallback(() => {
    const button = moreButtonRef.current;
    if (!button) {
      setMenuPosition(null);
      return;
    }

    const rect = button.getBoundingClientRect();
    const canOpenLeft = rect.left - MENU_WIDTH - MENU_GAP >= 16;
    const left = canOpenLeft
      ? rect.left - MENU_WIDTH - MENU_GAP
      : clampPosition(rect.right + MENU_GAP, 16, window.innerWidth - MENU_WIDTH - 16);
    const top = clampPosition(
      rect.bottom + 8,
      16,
      Math.max(16, window.innerHeight - 180),
    );

    setMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!visible) {
      setMenuOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!menuOpen) return;

    updateMenuPosition();
    const focusFrame = window.requestAnimationFrame(() => {
      firstMenuItemRef.current?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        moreButtonRef.current?.focus();
      }
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (moreButtonRef.current?.contains(target)) return;

      const menuRoot = document.getElementById("block-action-menu");
      if (menuRoot?.contains(target)) return;

      setMenuOpen(false);
    };

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [menuOpen, updateMenuPosition]);

  return (
    <>
      <div
        className={cn(
          "pointer-events-auto flex items-center rounded-2xl border border-slate-200/90 bg-slate-50/88 p-1 shadow-[0_12px_28px_-22px_rgba(15,23,42,0.42)] backdrop-blur transition-all duration-150",
          visible ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        <ActionButton
          title="Drag to reorder"
          className="cursor-grab active:cursor-grabbing"
          {...(dragAttributes as ButtonHTMLAttributes<HTMLButtonElement>)}
          {...(dragListeners as ButtonHTMLAttributes<HTMLButtonElement>)}
          onClick={(event) => event.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </ActionButton>

        {!compact ? (
          <>
            <ActionButton
              title="Move up"
              disabled={isFirst}
              onClick={(event) => {
                event.stopPropagation();
                onMoveUp();
              }}
            >
              <ArrowUp className="h-4 w-4" />
            </ActionButton>

            <ActionButton
              title="Move down"
              disabled={isLast}
              onClick={(event) => {
                event.stopPropagation();
                onMoveDown();
              }}
            >
              <ArrowDown className="h-4 w-4" />
            </ActionButton>
          </>
        ) : null}

        <ActionButton
          ref={moreButtonRef}
          title="More actions"
          active={menuOpen}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(event) => {
            event.stopPropagation();
            setMenuOpen((current) => !current);
          }}
        >
          <MoreHorizontal className="h-4 w-4" />
        </ActionButton>
      </div>

      {menuOpen && menuPosition
        ? createPortal(
            <div
              id="block-action-menu"
              className="fixed z-[80] w-[196px] rounded-2xl bg-white p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] ring-1 ring-slate-200"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              role="menu"
              aria-label="Block actions"
              onClick={(event) => event.stopPropagation()}
            >
              {compact ? (
                <>
                  <button
                    ref={firstMenuItemRef}
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => {
                      onMoveUp();
                      setMenuOpen(false);
                    }}
                    disabled={isFirst}
                  >
                    <ArrowUp className="h-4 w-4 text-slate-400" />
                    Move up
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-35"
                    onClick={() => {
                      onMoveDown();
                      setMenuOpen(false);
                    }}
                    disabled={isLast}
                  >
                    <ArrowDown className="h-4 w-4 text-slate-400" />
                    Move down
                  </button>
                </>
              ) : (
                <button
                  ref={firstMenuItemRef}
                  type="button"
                  role="menuitem"
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => {
                    onDuplicate();
                    setMenuOpen(false);
                  }}
                >
                  <Copy className="h-4 w-4 text-slate-400" />
                  Duplicate block
                </button>
              )}

              {!compact ? (
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                  onClick={() => {
                    onRemove();
                    setMenuOpen(false);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-rose-400" />
                  Delete block
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => {
                      onDuplicate();
                      setMenuOpen(false);
                    }}
                  >
                    <Copy className="h-4 w-4 text-slate-400" />
                    Duplicate block
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-200"
                    onClick={() => {
                      onRemove();
                      setMenuOpen(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-400" />
                    Delete block
                  </button>
                </>
              )}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
