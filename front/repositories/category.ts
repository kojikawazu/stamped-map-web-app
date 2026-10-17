import { useApiClient } from "~/repositories/api-client";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "~/schemas/category";
import type { CategoriesResponse, Category } from "~/types/category";

/**
 * カテゴリ API（`/api/categories`）へのアクセスを提供する。
 *
 * 認証ヘッダーを付与する `apiFetch` を setup 時に確保するため、
 * composable の同期実行部分（`await` より前）で呼ぶこと。
 *
 * @returns カテゴリの一覧取得・登録・更新・削除を行う関数群
 */
export const useCategoryRepository = () => {
  const { apiFetch } = useApiClient();

  return {
    /**
     * カテゴリを全件取得する。
     *
     * @returns 全カテゴリ（`sortOrder` の昇順）
     */
    list: async (): Promise<Category[]> => {
      const res = await apiFetch<CategoriesResponse>("/api/categories");
      return res.data;
    },

    /**
     * カテゴリを登録する。
     *
     * @param input - 登録内容（`createCategorySchema` で検証済みの値）
     * @returns 登録されたカテゴリ
     */
    create: async (input: CreateCategoryInput): Promise<Category> => {
      const res = await apiFetch<{ data: Category }>("/api/categories", {
        method: "POST",
        body: input,
      });
      return res.data;
    },

    /**
     * カテゴリを更新する（全項目を送る）。
     *
     * @param id - 対象カテゴリの UUID
     * @param input - 更新内容（`updateCategorySchema` で検証済みの値）
     * @returns 更新後のカテゴリ
     */
    update: async (
      id: string,
      input: UpdateCategoryInput,
    ): Promise<Category> => {
      const res = await apiFetch<{ data: Category }>(`/api/categories/${id}`, {
        method: "PUT",
        body: input,
      });
      return res.data;
    },

    /**
     * カテゴリを削除する。
     *
     * 使用中・デフォルトのカテゴリは 400 で拒否される。エラーはそのまま投げ、
     * サーバーのメッセージ（`err.data.message`）の扱いは呼び出し側に委ねる。
     *
     * @param id - 対象カテゴリの UUID
     */
    remove: async (id: string): Promise<void> => {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
    },
  };
};
