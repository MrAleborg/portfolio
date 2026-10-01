/** A fetch that answers with the given status and JSON body. */
export function respondWith(status: number, json: unknown) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(JSON.stringify(json), {
        status,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
}
