import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリ名は必須です")
    .max(50, "カテゴリ名は50文字以内で入力してください"),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "有効なカラーコード（#RRGGBB）を入力してください"),
});

export const updateCategorySchema = createCategorySchema;

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
