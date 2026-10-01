import type { Credential } from '@/domain/credential/Credential'
import type { Localized } from '@/domain/i18n/Locale'

/** The fields every credential has in the API. */
export interface CredentialDto {
  id: number
  name: Localized<string>
  issuer: string
  issue_date: string
  expiration_date: string | null
  credential_url: string
  description: Localized<string>
}

export function toCredential(dto: CredentialDto): Credential {
  return {
    id: dto.id,
    name: dto.name,
    issuer: dto.issuer,
    issueDate: dto.issue_date,
    expirationDate: dto.expiration_date,
    credentialUrl: dto.credential_url,
    description: dto.description,
  }
}
