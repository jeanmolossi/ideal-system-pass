export function formatCredential(id: string, category?: string) {
  return category ? `${id} (${category})` : id;
}
