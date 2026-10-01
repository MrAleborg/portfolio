import { createHttpProfessionalExperienceRepository } from '@/infrastructure/professionalExperience/httpProfessionalExperienceRepository'
import { respondWith } from '@/test/respondWith'

const project = {
  id: 1,
  title: { en: 'Portfolio site', fr: 'Site portfolio' },
  start_date: '2023-01-01',
  end_date: '2023-06-30',
  is_current: false,
  description: { en: 'A site about me.', fr: 'Un site sur moi.' },
  achievements: [{ en: 'Shipped in six months', fr: 'Livré en six mois' }],
  experience: { id: 1 },
  missions: [{ en: 'Design the API', fr: 'Concevoir l’API' }],
  tags: [{ id: 1, name: { en: 'React', fr: 'React' }, kind: 'skill' }],
}

const acme = {
  id: 1,
  company: 'Acme',
  position: { en: 'Software engineer', fr: 'Ingénieur logiciel' },
  employment_type: 'full_time',
  company_url: 'https://example.com/acme',
  location: { en: 'Paris', fr: 'Paris' },
  start_date: '2019-09-01',
  end_date: '2022-08-31',
  is_current: false,
  description: { en: 'Built the platform.', fr: 'Construction de la plateforme.' },
  projects: [project],
}

const globex = {
  id: 2,
  company: 'Globex',
  position: { en: 'Consultant', fr: 'Consultant' },
  employment_type: 'freelance',
  company_url: '',
  location: { en: '', fr: '' },
  start_date: '2023-01-01',
  end_date: null,
  is_current: true,
  description: { en: '', fr: '' },
  projects: [],
}

describe('httpProfessionalExperienceRepository', () => {
  it('requests the professional experiences endpoint', async () => {
    const fetchFn = respondWith(200, [acme, globex])

    await createHttpProfessionalExperienceRepository('https://api.example.com', fetchFn).list()

    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.example.com/api/v1/experience/professional-experiences/',
    )
  })

  it('turns the response into experiences with their projects, in the same order', async () => {
    const repository = createHttpProfessionalExperienceRepository(
      'https://api.example.com',
      respondWith(200, [acme, globex]),
    )

    await expect(repository.list()).resolves.toEqual([
      {
        id: 1,
        company: 'Acme',
        position: { en: 'Software engineer', fr: 'Ingénieur logiciel' },
        employmentType: 'full_time',
        companyUrl: 'https://example.com/acme',
        location: { en: 'Paris', fr: 'Paris' },
        period: { start: '2019-09-01', end: '2022-08-31' },
        description: { en: 'Built the platform.', fr: 'Construction de la plateforme.' },
        projects: [
          {
            id: 1,
            title: { en: 'Portfolio site', fr: 'Site portfolio' },
            period: { start: '2023-01-01', end: '2023-06-30' },
            description: { en: 'A site about me.', fr: 'Un site sur moi.' },
            achievements: [{ en: 'Shipped in six months', fr: 'Livré en six mois' }],
            missions: [{ en: 'Design the API', fr: 'Concevoir l’API' }],
            tags: [{ id: 1, name: { en: 'React', fr: 'React' }, kind: 'skill' }],
          },
        ],
      },
      {
        id: 2,
        company: 'Globex',
        position: { en: 'Consultant', fr: 'Consultant' },
        employmentType: 'freelance',
        companyUrl: '',
        location: { en: '', fr: '' },
        period: { start: '2023-01-01', end: null },
        description: { en: '', fr: '' },
        projects: [],
      },
    ])
  })

  it('fails on a server error', async () => {
    const repository = createHttpProfessionalExperienceRepository(
      'https://api.example.com',
      respondWith(500, {}),
    )

    await expect(repository.list()).rejects.toThrow('500')
  })
})
