"use client";

import Link from "next/link";
import { Database, FileSpreadsheet, ShieldCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ImportTemplatesDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Hizli ice aktar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>XLSX ice aktarma hazirligi</DialogTitle>
          <DialogDescription>
            Akis,
            {" "}
            <span className="font-medium text-white">MessageTemplate</span>
            {" "}
            sayfasi ve satir yapisi ile uyumludur.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <FileSpreadsheet className="mb-3 h-5 w-5 text-amber-200" />
            <p className="text-sm font-medium text-white">Workbook odakli</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Ana workbook bilgisi once okunur.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <Database className="mb-3 h-5 w-5 text-cyan-200" />
            <p className="text-sm font-medium text-white">Sayfa hedefi</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Varsayilan sayfa MessageTemplate olarak korunur.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
            <ShieldCheck className="mb-3 h-5 w-5 text-emerald-200" />
            <p className="text-sm font-medium text-white">Guvenli akis</p>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Yerel dosya tabanlı düzenleme mantığına göre hazırlanır.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button asChild>
            <Link href="/import">İçe aktarma alanını aç</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
