import { postJson } from '@/infrastructure/http/postJson'
import { respondWith } from '@/test/respondWith'

describe('postJson', () => {
  it('posts the body as JSON to the path on the API URL', async () => {
    const fetchFn = respondWith(200, {})

    await postJson('https://api.example.com', '/api/v1/hello/', { hello: 'world' }, fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/hello/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hello: 'world' }),
    })
  })

  it('accepts an API URL with a trailing slash', async () => {
    const fetchFn = respondWith(200, {})

    await postJson('https://api.example.com/', '/api/v1/hello/', {}, fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/hello/', expect.anything())
  })

  it('posts to the same domain without an API URL', async () => {
    const fetchFn = respondWith(200, {})

    await postJson('', '/api/v1/hello/', {}, fetchFn)

    expect(fetchFn).toHaveBeenCalledWith('/api/v1/hello/', expect.anything())
  })

  it('answers with the response whatever its status, for the caller to interpret', async () => {
    const response = await postJson(
      'https://api.example.com',
      '/api/v1/hello/',
      {},
      respondWith(400, { email: ['Enter a valid email address.'] }),
    )

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ email: ['Enter a valid email address.'] })
  })
})
