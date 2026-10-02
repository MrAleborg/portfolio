import type { Certification } from '@/domain/certification/Certification'
import { TagList } from '@/ui/components/TagList'
import { CredentialTile } from '@/ui/resume/CredentialTile'

interface CertificationTileProps {
  certification: Certification
  /** The level of the title heading; 4 for a tile nested in another. */
  headingLevel?: 3 | 4
}

export function CertificationTile({ certification, headingLevel }: CertificationTileProps) {
  return (
    <CredentialTile credential={certification} headingLevel={headingLevel}>
      {certification.tags.length > 0 ? <TagList tags={certification.tags} /> : null}
    </CredentialTile>
  )
}
