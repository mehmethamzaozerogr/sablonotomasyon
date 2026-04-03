import { z } from "zod";

export const settingsSchema = z.object({
  studioName: z.string().min(2, "Studyo adi zorunludur."),
  defaultSheetName: z.string().min(2, "Varsayilan sayfa adi zorunludur."),
  autosave: z.boolean(),
  enablePreviewPane: z.boolean(),
  requireReviewOnExport: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
