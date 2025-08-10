import React from 'react'
import { Link } from 'react-router-dom'

const SubCard = ({ to, title, icon: Icon, onClick, width = "" }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center justify-center gap-2 bg-gray-200 rounded-lg px-8 py-4 text-base font-semibold shadow hover:bg-gray-300 transition lg:${width}`}
  >
    <span>{title}</span>
    {Icon && <Icon className="h-6 w-6" />}
  </Link>
)

export default SubCard