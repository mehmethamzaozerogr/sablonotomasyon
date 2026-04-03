export type BindingSourceScope = "root" | "item";

export type BindingFieldTarget =
  | "text"
  | "image"
  | "href"
  | "label"
  | "price"
  | "badge"
  | "title";

export type TextTransform = "none" | "uppercase" | "lowercase" | "title";

export type BindingFormat =
  | {
      type: "none";
    }
  | {
      type: "text";
      transform: TextTransform;
    }
  | {
      type: "currency";
      locale: string;
      currency?: string;
      currencyPath?: string;
    };

export type StaticBindingSegment = {
  id: string;
  kind: "static";
  value: string;
};

export type PathBindingSegment = {
  id: string;
  kind: "path";
  scope: BindingSourceScope;
  path: string;
  label: string;
};

export type BindingSegment = StaticBindingSegment | PathBindingSegment;

export type BlockFieldBinding = {
  target: BindingFieldTarget;
  segments: BindingSegment[];
  fallback?: string;
  format: BindingFormat;
};

export type RepeaterBinding = {
  sourcePath: string;
  label: string;
  itemAlias: string;
  emptyFallback?: string;
  limit?: number;
};

export type BindingPathKind =
  | "string"
  | "number"
  | "boolean"
  | "object"
  | "array"
  | "null";

export type BindingPathOption = {
  path: string;
  displayPath: string;
  label: string;
  scope: BindingSourceScope;
  kind: BindingPathKind;
  depth: number;
  sample?: string;
  searchText: string;
  description?: string;
  group?: string;
};
