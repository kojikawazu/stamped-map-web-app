export const useIsOwner = () => {
  const isOwner = useState<boolean>("isOwner", () => false);
  const { apiFetch } = useApiClient();

  const fetchIsOwner = async () => {
    // 取得前にリセットし、エラー時やログイン切り替え時に前の状態が残らないようにする
    isOwner.value = false;
    try {
      const res = await apiFetch<{ data: { isOwner: boolean } }>("/api/me/is-owner");
      isOwner.value = res.data.isOwner;
    } catch {
      isOwner.value = false;
    }
  };

  return { isOwner, fetchIsOwner };
};
