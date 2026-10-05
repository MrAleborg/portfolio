import { useId, useState, type FormEvent } from 'react'
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
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string>()
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [failure, setFailure] = useState<ContactSendFailure>()

  function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    setFieldErrors({})
    setFailure(undefined)
    repository.send({ name, email, message }).then(
      () => setSentTo(email),
      (error: unknown) => {
        setSending(false)
        if (error instanceof ContactSendError) {
          setFieldErrors(error.fieldErrors)
          setFailure(error.reason)
        }
      },
    )
  }

  if (sentTo !== undefined) {
    return <p role="status">{text.contactSent(sentTo)}</p>
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
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {fieldErrors.name && (
          <p id={`${id}-name-error`} className="contact-form__error">
            {fieldErrors.name[0]}
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
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        {fieldErrors.email && (
          <p id={`${id}-email-error`} className="contact-form__error">
            {fieldErrors.email[0]}
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
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
        {fieldErrors.message && (
          <p id={`${id}-message-error`} className="contact-form__error">
            {fieldErrors.message[0]}
          </p>
        )}
      </div>
      {failure === 'throttled' && <p role="alert">{text.contactThrottled}</p>}
      {failure === 'unavailable' && <p role="alert">{text.contactUnavailable}</p>}
      <button type="submit" className="contact-form__submit" disabled={sending}>
        {sending ? text.contactSending : text.contactSend}
      </button>
    </form>
  )
}
