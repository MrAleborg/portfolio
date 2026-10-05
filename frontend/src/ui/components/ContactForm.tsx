import { useId } from 'react'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import './ContactForm.css'

/** The form to write to the owner. */
export function ContactForm() {
  const text = messages[useLocale().locale]
  const id = useId()

  return (
    <form className="contact-form">
      <div className="contact-form__field">
        <label htmlFor={`${id}-name`}>{text.contactName}</label>
        <input id={`${id}-name`} name="name" type="text" />
      </div>
      <div className="contact-form__field">
        <label htmlFor={`${id}-email`}>{text.contactEmail}</label>
        <input id={`${id}-email`} name="email" type="email" />
      </div>
      <div className="contact-form__field">
        <label htmlFor={`${id}-message`}>{text.contactMessage}</label>
        <textarea id={`${id}-message`} name="message" rows={6} />
      </div>
      <button type="submit" className="contact-form__submit">
        {text.contactSend}
      </button>
    </form>
  )
}
