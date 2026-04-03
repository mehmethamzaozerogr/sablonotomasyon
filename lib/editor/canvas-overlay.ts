import type {
  HtmlVarOccurrence,
  HtmlVarReplacementOption,
} from "@/lib/bindings/html-vars";
import type { HtmlTextRegion } from "@/lib/editor/custom-html-text";

export type CanvasOverlayRect = {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

export type CanvasToolbarOverlay = {
  anchorRect: CanvasOverlayRect;
  region: HtmlTextRegion;
  visible: boolean;
  variablePickerOpen: boolean;
  moreMenuOpen: boolean;
  insertVariableOptions: HtmlVarReplacementOption[];
  onEdit: () => void;
  onToggleVariablePicker: () => void;
  onCloseVariablePicker: () => void;
  onSelectVariable: (path: string) => void;
  onStyle: () => void;
  onToggleMore: () => void;
  onCloseMore: () => void;
};

export type CanvasOccurrencePickerOverlay = {
  anchorRect: CanvasOverlayRect;
  occurrence: HtmlVarOccurrence;
  options: HtmlVarReplacementOption[];
  onSelect: (path: string) => void;
  onClose: () => void;
};
