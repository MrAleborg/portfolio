import type { ReactNode } from 'react'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

interface ExternalLinkProps {
  href: string
  children: ReactNode
  /** What the link is about, read by screen readers after its text but not shown. */
  context?: string
}

/** A link to another site, opened in a new tab and announced as such. */
export function ExternalLink({ href, children, context }: ExternalLinkProps) {
  const text = messages[useLocale().locale]

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      {context ? (
        <>
          {text.spaceBeforeColon}
          <span className="visually-hidden">: {context}</span>
        </>
      ) : null}{' '}
      <span className="visually-hidden">{text.opensInNewTab}</span>
    </a>
  )
}
