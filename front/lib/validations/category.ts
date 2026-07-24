import { z } from "zod";

/**
 * カテゴリ登録リクエストの検証スキーマ。
 *
 * Server API（`POST /api/categories`）とフォームの双方で使う。
 * 名前の一意性は DB の unique 制約で担保するため、ここでは検証しない。
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, "カテゴリ名は必須です")
    .max(50, "カテゴリ名は50文字以内で入力してください"),
  color: z
    .string()
    .regex(
      /^#[0-9A-Fa-f]{6}$/,
      "有効なカラーコード（#RRGGBB）を入力してください",
    ),
});

/**
 * カテゴリ更新リクエストの検証スキーマ。
 *
 * 更新は全項目を送る仕様のため、登録と同一ルールを再利用する。
 */
export const updateCategorySchema = createCategorySchema;

/** カテゴリ登録リクエストの入力値。スキーマから導出する */
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
/** カテゴリ更新リクエストの入力値。スキーマから導出する */
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
