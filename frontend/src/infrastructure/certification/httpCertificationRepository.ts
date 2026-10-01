import type { CertificationRepository } from '@/domain/certification/CertificationRepository'
import { type CredentialDto, toCredential } from '@/infrastructure/credential/toCredential'
import type { ReferenceDto, TagDto } from '@/infrastructure/http/dtos'
import { getJson } from '@/infrastructure/http/getJson'

interface CertificationDto extends CredentialDto {
  tags: TagDto[]
  specializations: ReferenceDto[]
}

export function createHttpCertificationRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): CertificationRepository {
  return {
    async list() {
      const dtos = await getJson<CertificationDto[]>(
        apiUrl,
        '/api/v1/experience/certifications/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        ...toCredential(dto),
        tags: dto.tags,
        specializations: dto.specializations,
      }))
    },
  }
}
