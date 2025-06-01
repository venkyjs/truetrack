import { render, screen } from '@testing-library/react';
import AppHeader from '../AppHeader';
import '@testing-library/jest-dom';

describe('AppHeader component', () => {
  // Mock the props expected by AppHeader
  const mockOnOpenPreferences = vi.fn();
  const mockOnAddProject = vi.fn();

  it('renders the logo', () => {
    render(<AppHeader onOpenPreferences={mockOnOpenPreferences} onAddProject={mockOnAddProject} />);
    const logo = screen.getByAltText('TrueTrack!'); // Corrected alt text
    expect(logo).toBeInTheDocument();
  });

  // Removed test for title prop as it's not used by the component

  it('renders the settings icon with accessible name', () => {
    render(<AppHeader onOpenPreferences={mockOnOpenPreferences} onAddProject={mockOnAddProject} />);
    // The button will get its accessible name from the aria-label we'll add
    const settingsIcon = screen.getByRole('button', { name: /Preferences/i });
    expect(settingsIcon).toBeInTheDocument();
  });
});
