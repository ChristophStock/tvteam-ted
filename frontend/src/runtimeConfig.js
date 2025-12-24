// Fetch runtime config from backend
export async function fetchRuntimeConfig() {
  try {
    const res = await fetch("/api/config");
    if (!res.ok) throw new Error("Failed to fetch config");
    return await res.json();
  } catch (e) {
    return { title: "Voting App" };
  }
}
