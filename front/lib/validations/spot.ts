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
        // UTC 基準で当日と比較する（サーバータイムゾーン依存を排除）
        // ⚠️ JST (UTC+9) では日本時間 00:00〜08:59 の間、UTC 当日が前日になるため
        //    その時間帯に当日の日付を入力すると拒否される場合がある。個人アプリとして許容する。
        const todayUtc = new Date().toISOString().split("T")[0];
        return date <= todayUtc;
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
