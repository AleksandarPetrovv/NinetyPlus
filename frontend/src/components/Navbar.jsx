import { NavLink } from 'react-router-dom'
import { Person } from '@mui/icons-material'

function Navbar() {
  return (
    <nav className="bg-dark-200 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <NavLink to="/" className="flex items-center py-4 px-2">
              <img src="/icons/favicon800x800.png" alt="NinetyPlus" className="h-12 w-12" />
            </NavLink>
          </div>
          
          <div className="flex-grow flex justify-center">
            <div className="flex items-center space-x-6">
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  `py-4 px-2 transition-colors ${isActive ? 'text-purple-500' : 'text-gray-300 hover:text-purple-500'}`
                }
              >
                Home
              </NavLink>
              <NavLink 
                to="/matches" 
                className={({ isActive }) => 
                  `py-4 px-2 transition-colors ${isActive ? 'text-purple-500' : 'text-gray-300 hover:text-purple-500'}`
                }
              >
                Matches
              </NavLink>
              <NavLink 
                to="/standings" 
                className={({ isActive }) => 
                  `py-4 px-2 transition-colors ${isActive ? 'text-purple-500' : 'text-gray-300 hover:text-purple-500'}`
                }
              >
                Standings
              </NavLink>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button className="p-2 rounded-full text-gray-300 hover:text-purple-500 hover:bg-dark-300 transition-colors">
              <Person />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar