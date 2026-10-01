/**
 * Fetches `path` from the API and returns its JSON body.
 *
 * Without an API URL, the path is requested on the site's own domain.
 */
export async function getJson<T>(
  apiUrl: string,
  path: string,
  fetchFn: typeof fetch,
): Promise<T> {
  const response = await fetchFn(`${apiUrl.replace(/\/$/, '')}${path}`)
  if (!response.ok) {
    throw new Error(`The request to ${path} failed with status ${response.status}`)
  }
  return response.json()
}
