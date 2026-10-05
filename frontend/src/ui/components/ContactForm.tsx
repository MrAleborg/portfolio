import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import type { ContactRepository } from '@/domain/contact/ContactRepository'
import {
  ContactSendError,
  type ContactFieldErrors,
  type ContactSendFailure,
} from '@/domain/contact/ContactSendError'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ContactForm.css'

interface ContactFormProps {
  repository: ContactRepository
}

/** The form to write to the owner. */
export function ContactForm({ repository }: ContactFormProps) {
  const text = messages[useLocale().locale]
  const id = useId()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [failure, setFailure] = useState<ContactSendFailure>()
  const confirmation = useRef<HTMLParagraphElement>(null)

  // The form is gone once the message is sent: the confirmation takes over the focus.
  useEffect(() => {
    confirmation.current?.focus()
  }, [sentTo])

  function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setFieldErrors({})
    setFailure(undefined)
    repository.send({ name, email, message, website }).then(
      () => setSentTo(email),
      (error: unknown) => {
        setSending(false)
        const refusal = error instanceof ContactSendError ? error : undefined
        const shown = refusal?.fieldErrors
        if (refusal?.reason === 'invalid' && (shown?.name || shown?.email || shown?.message)) {
          setFieldErrors(shown)
        } else {
          setFailure(refusal?.reason === 'throttled' ? 'throttled' : 'unavailable')
        }
      },
    )
  }

  if (sentTo !== undefined) {
    return (
      <p ref={confirmation} role="status" tabIndex={-1}>
        {text.contactSent(sentTo)}
      </p>
    )
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form__field">
        <label htmlFor={`${id}-name`}>{text.contactName}</label>
        <input
          id={`${id}-name`}
          name="name"
          aria-invalid={fieldErrors.name ? true : undefined}
          aria-describedby={fieldErrors.name ? `${id}-name-error` : undefined}
          type="text"
          required
          maxLength={100}
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {fieldErrors.name && (
          <p id={`${id}-name-error`} className="contact-form__error">
            {text.contactFieldErrors.name}
          </p>
        )}
      </div>
      <div className="contact-form__field">
        <label htmlFor={`${id}-email`}>{text.contactEmail}</label>
        <input
          id={`${id}-email`}
          name="email"
          aria-invalid={fieldErrors.email ? true : undefined}
          aria-describedby={fieldErrors.email ? `${id}-email-error` : undefined}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email && (
          <p id={`${id}-email-error`} className="contact-form__error">
            {text.contactFieldErrors.email}
          </p>
        )}
      </div>
      <div className="contact-form__field">
        <label htmlFor={`${id}-message`}>{text.contactMessage}</label>
        <textarea
          id={`${id}-message`}
          name="message"
          aria-invalid={fieldErrors.message ? true : undefined}
          aria-describedby={fieldErrors.message ? `${id}-message-error` : undefined}
          rows={6}
          required
          minLength={10}
          maxLength={5000}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        {fieldErrors.message && (
          <p id={`${id}-message-error`} className="contact-form__error">
            {text.contactFieldErrors.message}
          </p>
        )}
      </div>
      {/* A trap for bots: real visitors never see it, so a value in it means a bot filled the form. */}
      <div className="visually-hidden">
        <label htmlFor={`${id}-website`}>{text.contactTrap}</label>
        <input
          id={`${id}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>
      {failure === 'throttled' && (
        <p role="alert" className="contact-form__alert">
          {text.contactThrottled}
        </p>
      )}
      {failure === 'unavailable' && (
        <p role="alert" className="contact-form__alert">
          {text.contactUnavailable}
        </p>
      )}
      <button type="submit" className="contact-form__submit" disabled={sending}>
        {sending ? text.contactSending : text.contactSend}
      </button>
    </form>
  )
}
