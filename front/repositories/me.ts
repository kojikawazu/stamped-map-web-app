import { useApiClient } from "~/repositories/api-client";

/**
 * ログインユーザー自身に関する API（`/api/me`）へのアクセスを提供する。
 *
 * 認証ヘッダーを付与する `apiFetch` を setup 時に確保するため、
 * composable の同期実行部分（`await` より前）で呼ぶこと。
 *
 * @returns オーナー判定を取得する関数
 */
export const useMeRepository = () => {
  const { apiFetch } = useApiClient();

  return {
    /**
     * ログインユーザーが書き込み権限を持つオーナーかを取得する。
     *
     * @returns オーナーなら `true`
     */
    isOwner: async (): Promise<boolean> => {
      const res = await apiFetch<{ data: { isOwner: boolean } }>(
        "/api/me/is-owner",
      );
      return res.data.isOwner;
    },
  };
};
