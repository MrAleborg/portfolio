import { getJson } from '@/infrastructure/http/getJson'
import { respondWith } from '@/test/respondWith'

describe('getJson', () => {
  it('requests the path on the API URL and returns the JSON body', async () => {
    const fetchFn = respondWith(200, { hello: 'world' })

    await expect(getJson('https://api.example.com', '/api/v1/hello/', fetchFn)).resolves.toEqual({
      hello: 'world',
    })
    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/hello/')
  })

  it('accepts an API URL with a trailing slash', async () => {
    const fetchFn = respondWith(200, {})

    await getJson('https://api.example.com/', '/api/v1/hello/', fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/hello/')
  })

  it('requests the path on the same domain without an API URL', async () => {
    const fetchFn = respondWith(200, {})

    await getJson('', '/api/v1/hello/', fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('/api/v1/hello/')
  })

  it('fails with the status when the server does not answer successfully', async () => {
    await expect(
      getJson('https://api.example.com', '/api/v1/hello/', respondWith(503, {})),
    ).rejects.toThrow('503')
  })
})
