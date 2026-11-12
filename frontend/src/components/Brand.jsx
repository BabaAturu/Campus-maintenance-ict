import { Laptop } from 'lucide-react'
import { Link } from 'react-router-dom'

function Brand({ className = '' }) {
  return (
    <Link className={`brand ${className}`.trim()} to="/" aria-label="CampusCare home">
      <span className="brand-mark" aria-hidden="true">
        <Laptop size={20} strokeWidth={2.2} />
      </span>
      <span className="brand-name">
        CampusCare
        <span>ICT support portal</span>
      </span>
    </Link>
  )
}

export default Brand
