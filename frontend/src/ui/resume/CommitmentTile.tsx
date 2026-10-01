import type { Commitment } from '@/domain/commitment/Commitment'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { PeriodTime } from '@/ui/components/PeriodTime'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'
import { paragraphs } from '@/ui/text/paragraphs'

interface CommitmentTileProps {
  commitment: Commitment
}

export function CommitmentTile({ commitment }: CommitmentTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <Tile
      title={commitment.role[locale]}
      subtitle={commitment.organization}
      meta={[
        <PeriodTime period={commitment.period} />,
        commitment.location[locale],
        text.commitmentKinds[commitment.kind],
      ]}
    >
      {paragraphs(commitment.description[locale]).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
      {commitment.url ? (
        <p>
          <ExternalLink href={commitment.url} context={commitment.organization}>{text.websiteLink}</ExternalLink>
        </p>
      ) : null}
    </Tile>
  )
}
