export interface ContactMessage {
  name: string
  email: string
  message: string
  /** A field real visitors never see; a value there means a bot filled the form. */
  website?: string
}
