import type { ScientificCommunication } from '@/domain/scientificCommunication/ScientificCommunication'
import { ExternalLink } from '@/ui/components/ExternalLink'
import { MonthTime } from '@/ui/components/MonthTime'
import { Tile } from '@/ui/components/Tile'
import { messages } from '@/ui/i18n/messages'
import { useLocale } from '@/ui/i18n/useLocale'

interface ScientificCommunicationTileProps {
  communication: ScientificCommunication
}

export function ScientificCommunicationTile({
  communication,
}: ScientificCommunicationTileProps) {
  const { locale } = useLocale()
  const text = messages[locale]

  return (
    <Tile
      title={communication.title[locale]}
      subtitle={communication.venue}
      meta={[
        <MonthTime date={communication.date} />,
        text.scientificCommunicationKinds[communication.kind],
      ]}
    >
      {communication.authors ? <p>{communication.authors}</p> : null}
      {communication.url ? (
        <p>
          <ExternalLink href={communication.url} context={communication.title[locale]}>{text.seeOnline}</ExternalLink>
        </p>
      ) : null}
    </Tile>
  )
}
