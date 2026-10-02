import { fireEvent, render, screen } from '@testing-library/react'
import { Avatar } from '@/ui/components/Avatar'

function renderAvatar() {
  render(
    <Avatar
      src="/media/avatar.webp"
      fallbackSrc="/placeholder.svg"
      alt="Portrait of Ada"
    />,
  )
  return screen.getByRole('img', { name: 'Portrait of Ada' })
}

describe('Avatar', () => {
  it('shows the placeholder when the photo fails to load', () => {
    const image = renderAvatar()

    fireEvent.error(image)

    expect(image).toHaveAttribute('src', '/placeholder.svg')
  })
})
