import { z } from "zod";

export const createSpotSchema = z.object({
  name: z
    .string()
    .min(1, "スポット名は必須です")
    .max(100, "スポット名は100文字以内で入力してください"),
  categoryId: z.string().uuid("有効なカテゴリを選択してください"),
  latitude: z
    .number()
    .min(-90, "緯度は-90〜90の範囲で指定してください")
    .max(90, "緯度は-90〜90の範囲で指定してください"),
  longitude: z
    .number()
    .min(-180, "経度は-180〜180の範囲で指定してください")
    .max(180, "経度は-180〜180の範囲で指定してください"),
  visitedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "日付はYYYY-MM-DD形式で入力してください")
    .refine(
      (date) => {
        // 存在しない暦日（2024-02-31 等）を弾く
        const [year, month, day] = date.split("-").map(Number);
        const d = new Date(year, month - 1, day);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month - 1 &&
          d.getDate() === day
        );
      },
      { message: "存在しない日付です" }
    )
    .refine(
      (date) => {
        // ローカル日付ベースで未来日を判定（UTC解釈によるタイムゾーンずれを回避）
        const [year, month, day] = date.split("-").map(Number);
        const now = new Date();
        const todayLocal = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const inputLocal = new Date(year, month - 1, day);
        return inputLocal <= todayLocal;
      },
      { message: "未来の日付は指定できません" }
    ),
  memo: z
    .string()
    .max(1000, "メモは1000文字以内で入力してください")
    .optional()
    .or(z.literal("")),
});

export const updateSpotSchema = createSpotSchema;

export type CreateSpotInput = z.infer<typeof createSpotSchema>;
export type UpdateSpotInput = z.infer<typeof updateSpotSchema>;
