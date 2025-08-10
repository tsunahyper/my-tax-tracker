import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserCircleIcon, ArrowRightCircleIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

const Navbar = () => {
  const [mobileMenu, setMobileMenu] = useState(false)
  const location = useLocation();

  const handleLogout = () => {
    // Use a full page redirect so browser follows all backend/Cognito redirects
    window.location.href = `${import.meta.env.VITE_API_LOGOUT_URL}`;
  };

  return (
    <nav className="bg-gray-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Title always visible */}
          <Link to="/dashboard" className='text-white text-lg font-bold'>
            MY TAX TRACKER
          </Link>
          {/* Desktop nav: visible on sm and up */}
          <div className='hidden sm:flex items-center gap-3'>
            <Link
              to="/dashboard"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium
                ${location.pathname === "/dashboard" ? "bg-gray-600 font-bold" : "hover:text-gray-400 hover:bg-gray-600 focus:bg-gray-600"}
              `}
            >
              Dashboard
            </Link>
            <Link
              to="/receipt"
              className={`text-white px-3 py-2 rounded-md text-sm font-medium
                ${location.pathname === "/receipt" ? "bg-gray-600 font-bold" : "hover:text-gray-400 hover:bg-gray-600 focus:bg-gray-600"}
              `}
            >
              Receipt Management
            </Link>
            <Link
              to="/profile"
              className="px-3 py-2 rounded-md text-sm font-medium"
            >
              <button
                type="button"
                className={
                  `rounded-full bg-gray-800 p-1 text-white hover:text-gray-400 
                  focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800
                  ${location.pathname === "/profile" ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""}`
                }
                tabIndex={0}
              >
                <span className="sr-only">User Profile</span>
                <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
              </button>
            </Link>
            <button
              type="button"
              className="rounded-full bg-gray-800 p-1 text-red-400 hover:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              onClick={handleLogout}
            >
              <span className="sr-only">Log Out</span>
              <ArrowRightCircleIcon className="h-8 w-8" aria-hidden="true" />
            </button>
          </div>
          {/* Mobile nav: visible only on mobile */}
          <div className="flex sm:hidden items-center gap-2">
            {/* User Profile Button (Mobile) */}
            <Link to="/profile">
              <button
                type="button"
                className={
                  `rounded-full bg-gray-800 p-1 text-white hover:text-gray-400 
                  focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800
                  ${location.pathname === "/profile" ? "ring-2 ring-white ring-offset-2 ring-offset-gray-800" : ""}`
                }
                tabIndex={0}
              >
                <span className="sr-only">User Profile</span>
                <UserCircleIcon className="h-8 w-8" aria-hidden="true" />
              </button>
            </Link>

            {/* Logout Button (Mobile) */}
            <button
              type="button"
              className="rounded-full bg-gray-800 p-1 text-red-400 hover:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              onClick={handleLogout}
            >
              <span className="sr-only">Log Out</span>
              <ArrowRightCircleIcon className="h-8 w-8" aria-hidden="true" />
            </button>

            {/* Menu Button (Mobile) */}
            <button
              type="button"
              className="rounded-full bg-gray-800 p-1 text-white hover:text-gray-400 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              <span className="sr-only">Mobile Menu</span>
              {mobileMenu ? (
                <XMarkIcon className="h-8 w-8" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-8 w-8" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu dropdown */}
      {mobileMenu && (
        <div className="sm:hidden bg-gray-700 px-2 pt-2 pb-3 space-y-1">
          <Link
            to="/dashboard"
            className="block text-white px-3 py-2 rounded-md text-base font-medium hover:bg-gray-600"
            onClick={() => setMobileMenu(false)}
          >
            Home
          </Link>
          <Link
            to="/receipt"
            className="block text-white px-3 py-2 rounded-md text-base font-medium hover:bg-gray-600"
            onClick={() => setMobileMenu(false)}
          >
            Receipt Management
          </Link>
        </div>
      )}
    </nav>
  )
}

export default Navbar