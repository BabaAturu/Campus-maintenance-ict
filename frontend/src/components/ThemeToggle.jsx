import { Moon, Sun } from 'lucide-react'
import useTheme from '../context/ThemeContext.jsx'
import './ThemeToggle.css'

function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme()
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'light' ? Moon : Sun

  return (
    <button
      className={`theme-toggle ${className}`.trim()}
      type="button"
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      onClick={toggleTheme}
    >
      <Icon size={17} aria-hidden="true" />
      <span>{theme === 'light' ? 'Dark mode' : 'Light mode'}</span>
    </button>
  )
}

export default ThemeToggle
