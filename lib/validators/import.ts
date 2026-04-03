import { z } from "zod";

export const importSchema = z.object({
  workbookName: z
    .string()
    .min(2, "Workbook adi en az 2 karakter olmalidir."),
  sheetName: z.string().min(2, "Sayfa adi zorunludur.").default("MessageTemplate"),
  category: z.enum(["order", "invoice", "return", "shipping"]),
  importMode: z.enum(["merge", "replace"]),
  notes: z.string().max(280, "Not alani 280 karakteri gecemez.").optional(),
});

export type ImportFormValues = z.infer<typeof importSchema>;
