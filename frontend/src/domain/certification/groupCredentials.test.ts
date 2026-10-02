import type { Certification } from '@/domain/certification/Certification'
import { groupCredentials } from '@/domain/certification/groupCredentials'
import type { Specialization } from '@/domain/specialization/Specialization'

const name = (value: string) => ({ en: value, fr: value })

const certification = (id: number, specializationIds: number[] = []): Certification => ({
  id,
  name: name(`Certification ${id}`),
  issuer: 'Issuer',
  issueDate: '2023-01-01',
  expirationDate: null,
  credentialUrl: '',
  description: name(''),
  tags: [],
  specializations: specializationIds.map((id) => ({ id, name: name(`Specialization ${id}`) })),
})

const specialization = (id: number, certificationIds: number[] = []): Specialization => ({
  id,
  name: name(`Specialization ${id}`),
  issuer: 'Issuer',
  issueDate: '2023-01-01',
  expirationDate: null,
  credentialUrl: '',
  description: name(''),
  certifications: certificationIds.map((id) => ({ id, name: name(`Certification ${id}`) })),
})

const nested = (specializationEntry: Specialization, certifications: Certification[]) => ({
  kind: 'specialization',
  specialization: specializationEntry,
  certifications,
})
const alone = (certificationEntry: Certification) => ({
  kind: 'certification',
  certification: certificationEntry,
})

describe('groupCredentials', () => {
  it('keeps a certification part of no specialization as a standalone entry', () => {
    const lonely = certification(1)
    const empty = specialization(10)

    expect(groupCredentials([empty], [lonely])).toEqual([nested(empty, []), alone(lonely)])
  })

  it('nests a certification under the specialization that lists it, not as a standalone entry', () => {
    const part = certification(1, [10])
    const parent = specialization(10, [1])

    expect(groupCredentials([parent], [part])).toEqual([nested(parent, [part])])
  })

  it('nests a certification under each specialization that lists it', () => {
    const shared = certification(1, [10, 11])
    const first = specialization(10, [1])
    const second = specialization(11, [1])

    expect(groupCredentials([first, second], [shared])).toEqual([
      nested(first, [shared]),
      nested(second, [shared]),
    ])
  })

  it('skips a listed certification missing from the certification list', () => {
    const present = certification(1, [10])
    const parent = specialization(10, [2, 1])

    expect(groupCredentials([parent], [present])).toEqual([nested(parent, [present])])
  })

  it('keeps a certification no specialization lists as standalone, even if it claims one', () => {
    const claiming = certification(1, [10])
    const parent = specialization(10)

    expect(groupCredentials([parent], [claiming])).toEqual([nested(parent, []), alone(claiming)])
  })

  it('lists the specializations first, then the standalone certifications, each in input order', () => {
    const first = specialization(10, [3, 1])
    const second = specialization(11)
    const [one, two, three, four] = [
      certification(1, [10]),
      certification(2),
      certification(3, [10]),
      certification(4),
    ] as [Certification, Certification, Certification, Certification]

    expect(groupCredentials([first, second], [one, two, three, four])).toEqual([
      nested(first, [three, one]),
      nested(second, []),
      alone(two),
      alone(four),
    ])
  })
})
