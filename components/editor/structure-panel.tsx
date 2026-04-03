"use client";

import { useMemo, useState } from "react";
import { ChevronRight, Layers3, Search, Sparkles, Variable } from "lucide-react";

import type {
  TemplateEditorAnalysis,
  TemplateStructureNode,
} from "@/lib/editor/template-intelligence";
import type { EditorSelection } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

type StructurePanelProps = {
  analysis: TemplateEditorAnalysis;
  selection: EditorSelection;
  onSelectBlock: (blockId: string) => void;
  onSelectRegion: (blockId: string, regionId: string) => void;
};

function matchesSelection(node: TemplateStructureNode, selection: EditorSelection) {
  if (selection.kind === "none") return false;
  if (selection.kind === "block") {
    return node.kind === "block" && node.blockId === selection.blockId;
  }
  if (selection.kind === "region") {
    return (
      node.kind === "region" &&
      node.blockId === selection.blockId &&
      node.regionId === selection.regionId
    );
  }
  return node.kind === "block" && node.blockId === selection.blockId;
}

function filterNode(node: TemplateStructureNode, query: string): TemplateStructureNode | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return node;
  }

  const filteredChildren = node.children
    .map((child) => filterNode(child, normalized))
    .filter((child): child is TemplateStructureNode => Boolean(child));

  if (node.searchableText.includes(normalized) || filteredChildren.length) {
    return {
      ...node,
      children: filteredChildren,
    };
  }

  return null;
}

function StructureNodeRow({
  node,
  depth,
  selection,
  onSelectBlock,
  onSelectRegion,
}: {
  node: TemplateStructureNode;
  depth: number;
  selection: EditorSelection;
  onSelectBlock: (blockId: string) => void;
  onSelectRegion: (blockId: string, regionId: string) => void;
}) {
  const selected = matchesSelection(node, selection);

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => {
          if (node.kind === "region" && node.blockId && node.regionId) {
            onSelectRegion(node.blockId, node.regionId);
            return;
          }

          if (node.blockId) {
            onSelectBlock(node.blockId);
          }
        }}
        className={cn(
          "group rounded-2xl border px-3 py-3 text-left transition",
          selected
            ? "border-primary/30 bg-primary/5 shadow-[0_0_0_3px_rgba(59,130,246,0.08)]"
            : "border-transparent bg-white/70 hover:border-slate-200 hover:bg-white",
        )}
        style={{ marginLeft: depth * 12 }}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-500">
            {node.kind === "region" ? (
              <Sparkles className="h-3.5 w-3.5" />
            ) : (
              <Layers3 className="h-3.5 w-3.5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-slate-950">{node.label}</p>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300 transition group-hover:text-slate-500" />
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {node.description}
            </p>
            {node.badges.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {node.badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-slate-500"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </button>

      {node.children.map((child) => (
        <StructureNodeRow
          key={child.id}
          node={child}
          depth={depth + 1}
          selection={selection}
          onSelectBlock={onSelectBlock}
          onSelectRegion={onSelectRegion}
        />
      ))}
    </div>
  );
}

export function StructurePanel({
  analysis,
  selection,
  onSelectBlock,
  onSelectRegion,
}: StructurePanelProps) {
  const [query, setQuery] = useState("");

  const filteredTree = useMemo(
    () => filterNode(analysis.structure, query),
    [analysis.structure, query],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%)]">
      <div className="border-b border-slate-200/80 px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">Structure</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Search sections, nested regions, and dynamic hotspots.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
              Dynamic
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-950">
              {analysis.summary.variables + analysis.summary.repeaters}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
          <div className="flex items-center gap-2 text-slate-400">
            <Search className="h-3.5 w-3.5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find header, footer, products..."
              className="w-full border-0 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-slate-200/80 px-4 py-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Blocks
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">{analysis.summary.blocks}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Regions
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-950">
            {analysis.summary.editableRegions}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Logic
          </p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-slate-950">
            <Variable className="h-3.5 w-3.5 text-slate-400" />
            {analysis.summary.conditionals + analysis.summary.repeaters}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 scrollbar-thin">
        {filteredTree ? (
          <div className="grid gap-3">
            {filteredTree.children.map((child) => (
              <StructureNodeRow
                key={child.id}
                node={child}
                depth={0}
                selection={selection}
                onSelectBlock={onSelectBlock}
                onSelectRegion={onSelectRegion}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-slate-950">No matching structure</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Try searching with broader section names like summary, footer, or button.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
