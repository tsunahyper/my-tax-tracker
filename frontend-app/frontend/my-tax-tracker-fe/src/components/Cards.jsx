import React from 'react'

const Card = ({ title, value, subtitle }) => {
  return (
    <div className="bg-gray-200 w-full md:w-1/2 lg:w-1/2 h-40 md:h-60 rounded-lg shadow flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-lg md:text-xl font-semibold mb-2">{title}</h2>
      <div className="text-2xl md:text-4xl font-bold mb-1">{value}</div>
      {subtitle && <div className="text-gray-600 italic text-sm">{subtitle}</div>}
    </div>
  )
}

export default Card