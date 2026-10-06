/**
 * Posts `body` as JSON to `path` on the API and answers with the response, whatever its status,
 * for the caller to interpret.
 *
 * Without an API URL, the path is requested on the site's own domain.
 */
export async function postJson(
  apiUrl: string,
  path: string,
  body: unknown,
  fetchFn: typeof fetch,
): Promise<Response> {
  return fetchFn(`${apiUrl.replace(/\/$/, '')}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}
