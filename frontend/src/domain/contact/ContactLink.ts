export type ContactLinkKind = 'email' | 'linkedin' | 'github' | 'website' | 'other'

export interface ContactLink {
  kind: ContactLinkKind
  url: string
}
