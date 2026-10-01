import type { ReactNode } from 'react'
import type { Credential } from '@/domain/credential/Credential'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { MonthTime } from '@/ui/components/MonthTime'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface CredentialTileProps {
  credential: Credential
  /** Extra details shown after the description and the link. */
  children?: ReactNode
}

export function CredentialTile({ credential, children }: CredentialTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <Tile
      title={credential.name[locale]}
      subtitle={credential.issuer}
      meta={[
        <>
          {text.issued} <MonthTime date={credential.issueDate} />
        </>,
        credential.expirationDate && (
          <>
            {text.expires} <MonthTime date={credential.expirationDate} />
          </>
        ),
      ]}
    >
      {paragraphs(credential.description[locale]).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {credential.credentialUrl ? (
        <p>
          <ExternalLink href={credential.credentialUrl} context={credential.name[locale]}>{text.seeCredential}</ExternalLink>
        </p>
      ) : null}
      {children}
    </Tile>
  )
}
