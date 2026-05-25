export async function getApiData<TData>(path: string): Promise<TData> {
  const response = await fetch(path, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const body = await response.json();
  if (!response.ok || !body.ok) {
    throw new Error(body.error?.message ?? "API request failed");
  }

  return body.data as TData;
}
