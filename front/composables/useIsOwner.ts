/**
 * ログインユーザーが書き込み権限を持つオーナーかを判定する。
 *
 * 非オーナーに Write 操作ボタンを表示しないために使う。
 * これは表示制御のみで、権限の実強制はサーバー側の `verifyOwner` が行う。
 *
 * @returns オーナー判定の共有状態 `isOwner` と、取得処理 `fetchIsOwner`
 */
export const useIsOwner = () => {
  const isOwner = useState<boolean>("isOwner", () => false);
  const { apiFetch } = useApiClient();

  const fetchIsOwner = async () => {
    // 取得前にリセットし、エラー時やログイン切り替え時に前の状態が残らないようにする
    isOwner.value = false;
    try {
      const res = await apiFetch<{ data: { isOwner: boolean } }>(
        "/api/me/is-owner",
      );
      isOwner.value = res.data.isOwner;
    } catch {
      isOwner.value = false;
    }
  };

  return { isOwner, fetchIsOwner };
};
