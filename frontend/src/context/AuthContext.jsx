import { createContext, useState, useEffect, useContext } from "react";
import {
  getCurrentUser,
  isAuthenticated as checkIsAuthenticated,
  logout as authLogout,
  checkTokenValidity,
} from "../services/authService";
import api from "../services/api";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favoriteTeam, setFavoriteTeam] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    const validateToken = async () => {
      if (checkIsAuthenticated()) {
        const isValid = await checkTokenValidity();
        if (isValid) {
          setUser(getCurrentUser());

          try {
            const detailsResponse = await api.get("/users/details/");
            setUserDetails(detailsResponse.data);
          } catch (err) {
            console.error("Failed to fetch user details", err);
          }

          try {
            const response = await api.get("/users/favorite-team/");
            if (response.data.favorite_team_id) {
              setFavoriteTeam(response.data);
            }
          } catch (err) {
            console.error("Failed to fetch favorite team", err);
          }
        } else {
          authLogout();
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const logout = () => {
    authLogout();
    setUser(null);
    setFavoriteTeam(null);
  };

  const updateFavoriteTeam = async (team) => {
    try {
      const response = await api.put("/users/favorite-team/", {
        favorite_team_id: team.id,
        favorite_team_name: team.name,
        favorite_team_crest: team.crest,
        favorite_team_league: team.league,
        favorite_team_country: team.country || getCountryFromLeague(team.league),
      });
      setFavoriteTeam(response.data);
      return true;
    } catch (err) {
      console.error("Failed to update favorite team", err);
      return false;
    }
  };

  const removeFavoriteTeam = async () => {
    try {
      await api.put("/users/favorite-team/", {
        favorite_team_id: null,
        favorite_team_name: null,
        favorite_team_crest: null,
        favorite_team_league: null,
        favorite_team_country: null
      });
      setFavoriteTeam(null);
      return true;
    } catch (err) {
      console.error("Failed to remove favorite team", err);
      return false;
    }
  };

  const value = {
    user,
    setUser,
    isAuthenticated: !!user,
    logout,
    loading,
    favoriteTeam,
    updateFavoriteTeam,
    removeFavoriteTeam,
    userDetails,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

const getCountryFromLeague = (leagueName) => {
  const leagueCountryMap = {
    "Premier League": "England",
    "La Liga": "Spain",
    "Bundesliga": "Germany",
    "Serie A": "Italy",
    "Ligue 1": "France"
  };
  return leagueCountryMap[leagueName] || "Unknown";
};