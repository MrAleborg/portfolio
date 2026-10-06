import { ContactSendError } from '@/domain/contact/ContactSendError'
import { createHttpContactRepository } from '@/infrastructure/contact/httpContactRepository'
import { respondWith } from '@/test/respondWith'

const message = { name: 'Grace', email: 'grace@example.com', message: 'Hello, I would like to talk.' }

function respondWithNoContent() {
  return vi.fn<typeof fetch>(() => Promise.resolve(new Response(null, { status: 204 })))
}

function failToConnect() {
  return vi.fn<typeof fetch>(() => Promise.reject(new TypeError('Failed to fetch')))
}

describe('httpContactRepository', () => {
  describe('links', () => {
    it('requests the contact links endpoint', async () => {
      const fetchFn = respondWith(200, [])

      await createHttpContactRepository('https://api.example.com', fetchFn).links()

      expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/profile/contact-links/')
    })

    it('turns the response into contact links, in the order received', async () => {
      const repository = createHttpContactRepository(
        'https://api.example.com',
        respondWith(200, [
          { kind: 'email', url: 'mailto:me@x.dev' },
          { kind: 'github', url: 'https://github.com/me' },
        ]),
      )

      await expect(repository.links()).resolves.toEqual([
        { kind: 'email', url: 'mailto:me@x.dev' },
        { kind: 'github', url: 'https://github.com/me' },
      ])
    })

    it('fails on a server error', async () => {
      const repository = createHttpContactRepository('https://api.example.com', respondWith(500, {}))

      await expect(repository.links()).rejects.toThrow('500')
    })
  })

  describe('send', () => {
    it('posts the message as JSON to the contact endpoint with an empty honeypot', async () => {
      const fetchFn = respondWithNoContent()

      await createHttpContactRepository('https://api.example.com', fetchFn).send(message)

      expect(fetchFn).toHaveBeenCalledWith('https://api.example.com/api/v1/profile/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...message, website: '' }),
      })
    })

    it('posts the honeypot value when the message carries one', async () => {
      const fetchFn = respondWithNoContent()

      await createHttpContactRepository('https://api.example.com', fetchFn).send({
        ...message,
        website: 'http://spam.example',
      })

      expect(fetchFn).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/profile/contact/',
        expect.objectContaining({ body: JSON.stringify({ ...message, website: 'http://spam.example' }) }),
      )
    })

    it('resolves once the server accepts the message', async () => {
      const repository = createHttpContactRepository(
        'https://api.example.com',
        respondWithNoContent(),
      )

      await expect(repository.send(message)).resolves.toBeUndefined()
    })

    it('rejects as invalid, with the field errors, when the server refuses the values', async () => {
      const repository = createHttpContactRepository(
        'https://api.example.com',
        respondWith(400, {
          email: ['Enter a valid email address.'],
          message: ['Ensure this field has at least 10 characters.'],
        }),
      )

      const error = await repository.send(message).catch((e: unknown) => e)

      expect(error).toBeInstanceOf(ContactSendError)
      expect(error).toMatchObject({
        reason: 'invalid',
        fieldErrors: {
          email: ['Enter a valid email address.'],
          message: ['Ensure this field has at least 10 characters.'],
        },
      })
    })

    it('rejects as unavailable when the server refuses the values without explaining', async () => {
      const refusal = vi.fn<typeof fetch>(() =>
        Promise.resolve(new Response('<h1>Bad Request</h1>', { status: 400 })),
      )
      const repository = createHttpContactRepository('https://api.example.com', refusal)

      await expect(repository.send(message)).rejects.toMatchObject({ reason: 'unavailable' })
    })

    it('rejects as throttled when the server answers 429', async () => {
      const repository = createHttpContactRepository(
        'https://api.example.com',
        respondWith(429, { detail: 'Request was throttled.' }),
      )

      await expect(repository.send(message)).rejects.toMatchObject({ reason: 'throttled' })
    })

    it.each([503, 500])('rejects as unavailable when the server answers %i', async (status) => {
      const repository = createHttpContactRepository(
        'https://api.example.com',
        respondWith(status, { detail: 'Unavailable.' }),
      )

      await expect(repository.send(message)).rejects.toMatchObject({ reason: 'unavailable' })
    })

    it('rejects as unavailable when the server cannot be reached', async () => {
      const repository = createHttpContactRepository('https://api.example.com', failToConnect())

      await expect(repository.send(message)).rejects.toMatchObject({ reason: 'unavailable' })
    })
  })
})
