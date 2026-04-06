export const useIsOwner = () => {
  const isOwner = useState<boolean>("isOwner", () => false);
  const { apiFetch } = useApiClient();

  const fetchIsOwner = async () => {
    const res = await apiFetch<{ data: { isOwner: boolean } }>("/api/me/is-owner");
    isOwner.value = res.data.isOwner;
  };

  return { isOwner, fetchIsOwner };
};
