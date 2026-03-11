import { render, screen } from '@testing-library/react'
import { RollingPointsNumber } from '@/components/points/RollingPointsNumber'

describe('RollingPointsNumber', () => {
  it('uses black text color consistently', () => {
    render(<RollingPointsNumber value={1234} className="text-sm font-medium" />)

    const value = screen.getByText('1,234')
    expect(value).toHaveClass('text-black')
    expect(value).not.toHaveClass('text-emerald-600')
    expect(value).not.toHaveClass('text-red-600')
  })
})
