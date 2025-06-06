import { useState, useRef, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Person } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import Login from "./Login";
import Register from "./Register";
import { toast } from "react-toastify";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  const buttonRef = useRef(null);

  const handleAuthButtonClick = () => {
    if (isAuthenticated) {
      setShowUserMenu(!showUserMenu);
    } else {
      setShowLogin(true);
    }
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    toast.success("Successfully logged out");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  return (
    <nav className="bg-dark-200 shadow-lg py-2">
      <div className="max-w-9xl mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex-shrink-0 w-1/3">
            <NavLink to="/" className="flex items-center py-2 px-2">
              <img
                src="/icons/favicon800x800.png"
                alt="NinetyPlus"
                className="h-16 w-16"
              />
            </NavLink>
          </div>

          <div className="flex justify-center w-1/3">
            <div className="flex items-center space-x-12">
              <NavLink
                to="/matches"
                className={({ isActive }) =>
                  `py-4 px-4 text-xl font-bold transition-colors ${
                    isActive
                      ? "text-purple-400"
                      : "text-gray-200 hover:text-purple-400"
                  }`
                }>
                Matches
              </NavLink>
              <NavLink
                to="/standings"
                className={({ isActive }) =>
                  `py-4 px-4 text-xl font-bold transition-colors ${
                    isActive
                      ? "text-purple-400"
                      : "text-gray-200 hover:text-purple-400"
                  }`
                }>
                Standings
              </NavLink>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 w-1/3">
            {isAuthenticated && (
              <span className="text-gray-200 text-lg font-semibold">
                Hi, <span className="text-purple-400">{user?.username}!</span>
              </span>
            )}
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={handleAuthButtonClick}
                className="p-3 rounded-full text-gray-200 hover:text-purple-400 hover:bg-dark-300 transition-colors">
                <Person sx={{ fontSize: 36 }} />
              </button>
              {showUserMenu && (
                <div
                  ref={userMenuRef}
                  className="absolute right-0 top-full mt-2 w-56 bg-dark-200 rounded-md shadow-lg z-20 border border-dark-300
                            transform opacity-100 scale-100 transition-all duration-200 origin-top-right"
                  style={{
                    animation: "fadeIn 0.2s ease-out forwards",
                  }}>
                  <div
                    className="py-2"
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu">
                    <NavLink
                      to="/profile"
                      className="block px-6 py-3 text-xl font-semibold text-gray-200 hover:bg-dark-300 transition-colors"
                      role="menuitem">
                      Your Profile
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-6 py-3 text-xl font-semibold text-gray-200 hover:bg-dark-300 transition-colors"
                      role="menuitem">
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Login
        open={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <Register
        open={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={handleSwitchToLogin}
      />
    </nav>
  );
}

export default Navbar;