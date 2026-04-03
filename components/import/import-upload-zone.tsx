"use client";

import { useRef, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { parseXlsxUpload, type XlsxImportResult } from "@/app/actions/xlsx-import";

type UploadState = "idle" | "dragging" | "parsing" | "done" | "error";

type ImportUploadZoneProps = {
  onResult: (result: XlsxImportResult, fileName: string) => void;
};

const ACCEPTED = ".xlsx,.xls";
const MAX_SIZE_MB = 20;

export function ImportUploadZone({ onResult }: ImportUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stagedFile, setStagedFile] = useState<File | null>(null);

  function validateFile(file: File): string | null {
    const name = file.name.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".xls")) {
      return "Yalnızca .xlsx ve .xls dosyaları desteklenmektedir.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `Dosya boyutu ${MAX_SIZE_MB} MB sınırını aşıyor.`;
    }
    return null;
  }

  async function processFile(file: File) {
    const validationError = validateFile(file);
    if (validationError) {
      setState("error");
      setErrorMsg(validationError);
      return;
    }

    setStagedFile(file);
    setState("parsing");
    setErrorMsg(null);

    const formData = new FormData();
    formData.set("file", file);

    try {
      const result = await parseXlsxUpload(formData);
      setState("done");
      onResult(result, file.name);
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
    }
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
    setState("dragging");
  }

  function onDragLeave() {
    setState((s) => (s === "dragging" ? "idle" : s));
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
    else setState("idle");
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  }

  function reset() {
    setState("idle");
    setErrorMsg(null);
    setStagedFile(null);
  }

  const isParsing = state === "parsing";
  const isDragging = state === "dragging";
  const isError = state === "error";
  const isDone = state === "done";

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-all duration-150",
          isDragging && "border-primary/50 bg-primary/[0.04]",
          isError && "border-red-300 bg-red-50",
          isDone && "border-emerald-300 bg-emerald-50",
          !isDragging && !isError && !isDone && "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => !isParsing && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && !isParsing && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="sr-only"
          onChange={onInputChange}
          aria-label="XLSX dosyası seç"
        />

        {/* Icon */}
        <div
          className={cn(
            "rounded-xl border p-4 transition-colors",
            isDragging && "border-primary/20 bg-primary/10 text-primary",
            isError && "border-red-200 bg-red-100 text-red-500",
            isDone && "border-emerald-200 bg-emerald-100 text-emerald-600",
            !isDragging && !isError && !isDone && "border-border bg-white text-muted-foreground",
          )}
        >
          {isParsing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isDone ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : (
            <FileSpreadsheet className="h-8 w-8" />
          )}
        </div>

        {/* Labels */}
        <div className="text-center">
          {isParsing ? (
            <>
              <p className="text-sm font-semibold text-foreground">Dosya işleniyor…</p>
              <p className="mt-1 text-xs text-muted-foreground">{stagedFile?.name ?? ""}</p>
            </>
          ) : isDone ? (
            <>
              <p className="text-sm font-semibold text-emerald-700">Dosya başarıyla işlendi</p>
              <p className="mt-1 text-xs text-muted-foreground">{stagedFile?.name ?? ""}</p>
            </>
          ) : isError ? (
            <>
              <p className="text-sm font-semibold text-red-600">Dosya okunamadı</p>
              <p className="mt-1.5 text-xs text-red-500">{errorMsg}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-foreground">
                {isDragging ? "Bırakabilirsiniz" : "XLSX dosyasını sürükleyin veya seçin"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                .xlsx ve .xls · maks. {MAX_SIZE_MB} MB
              </p>
            </>
          )}
        </div>

        {/* Upload button */}
        {!isParsing && !isDone && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            <UploadCloud className="h-4 w-4" />
            Dosya seç
          </Button>
        )}

        {/* Reset */}
        {(isDone || isError) && (
          <button
            type="button"
            title="Sıfırla"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              reset();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
