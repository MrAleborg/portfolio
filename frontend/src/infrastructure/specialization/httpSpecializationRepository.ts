import type { SpecializationRepository } from '@/domain/specialization/SpecializationRepository'
import { type CredentialDto, toCredential } from '@/infrastructure/credential/toCredential'
import type { ReferenceDto } from '@/infrastructure/http/dtos'
import { getJson } from '@/infrastructure/http/getJson'

interface SpecializationDto extends CredentialDto {
  certifications: ReferenceDto[]
}

export function createHttpSpecializationRepository(
  apiUrl = '',
  fetchFn: typeof fetch = fetch,
): SpecializationRepository {
  return {
    async list() {
      const dtos = await getJson<SpecializationDto[]>(
        apiUrl,
        '/api/v1/experience/specializations/',
        fetchFn,
      )
      return dtos.map((dto) => ({
        ...toCredential(dto),
        certifications: dto.certifications,
      }))
    },
  }
}
