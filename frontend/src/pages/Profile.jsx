import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import api from "../services/api";
import MatchDetails from "../components/MatchDetails";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import DeleteIcon from "@mui/icons-material/Delete"
import { toast } from "react-toastify";
import { DOMESTIC_LEAGUES } from "../config/leagues";

function Profile() {
  const {
    user,
    isAuthenticated,
    favoriteTeam,
    updateFavoriteTeam,
    removeFavoriteTeam,
    userDetails,
  } = useAuth();
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setAnimateIn(true);

    const fetchUserComments = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get("/comments/user/");
        setUserComments(response.data);
      } catch (err) {
        setError("Failed to load your comments");
      } finally {
        setLoading(false);
      }
    };

    fetchUserComments();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Navigate to="/" />;
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const handleDeleteComment = async (commentId) => {
    if (deletingComment) return;

    try {
      setDeletingComment(commentId);
      await api.delete(`/comments/delete/${commentId}/`);
      setUserComments(
        userComments.filter((comment) => comment.id !== commentId)
      );
      toast.success("Comment deleted successfully");
    } catch (err) {
      toast.error("Failed to delete comment");
      console.error("Failed to delete comment", err);
    } finally {
      setDeletingComment(null);
    }
  };

  const handleTeamSearch = async () => {
    if (!teamSearchQuery.trim() || teamSearchQuery.length < 3) {
      toast.info("Please enter at least 3 characters to search");
      return;
    }

    setIsSearching(true);
    const allTeams = [];
    let hasErrors = false;

    try {
      const leaguesToSearch = DOMESTIC_LEAGUES;
      
      for (const league of leaguesToSearch) {
        try {
          const response = await api.get(`/matches/standings/${league.id}/`, {
            timeout: 8000
          });
          
          if (response.data && Array.isArray(response.data.standings)) {
            const teams = response.data.standings[0].table.map(standing => ({
              id: standing.team.id,
              name: standing.team.name,
              shortName: standing.team.shortName,
              crest: standing.team.crest,
              league: league.name,
              country: league.country
            }));
            
            allTeams.push(...teams);
          } else if (response.data && Array.isArray(response.data)) {
            const teams = response.data.map(standing => ({
              id: standing.team.id,
              name: standing.team.name,
              shortName: standing.team.shortName,
              crest: standing.team.crest,
              league: league.name,
              country: league.country
            }));
            
            allTeams.push(...teams);
          }
        } catch (err) {
          console.error(`Failed to fetch teams for league ${league.name}`, err);
          hasErrors = true;
        }
      }
      
      const searchTerm = teamSearchQuery.toLowerCase();
      const filteredTeams = allTeams.filter(team => 
        team.name.toLowerCase().includes(searchTerm) || 
        (team.shortName && team.shortName.toLowerCase().includes(searchTerm))
      );
      
      setSearchResults(filteredTeams);
      
      if (filteredTeams.length === 0) {
        if (hasErrors) {
          toast.warning("Some leagues timed out. Try a more specific search term.");
        } else {
          toast.info("No teams found matching your search.");
        }
      }
    } catch (err) {
      toast.error("Search failed. Please try again later.");
      console.error("Failed to search for teams", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFavoriteTeam = async (team) => {
    const success = await updateFavoriteTeam(team);
    if (success) {
      toast.success(`${team.name} set as your favorite team!`);
      setSearchResults([]);
      setTeamSearchQuery("");
    } else {
      toast.error("Failed to update favorite team");
    }
  };

  const handleRemoveFavoriteTeam = async () => {
    const success = await removeFavoriteTeam();
    if (success) {
      toast.success("Favorite team removed");
    } else {
      toast.error("Failed to remove favorite team");
    }
  };

  const formatJoinDate = () => {
    if (!userDetails?.join_date) return "Unknown";

    const date = new Date(userDetails.join_date);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 animate-pageTransition">
      <div
        className="bg-dark-200 rounded-xl p-6 mb-8 border border-dark-300"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(-20px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}>
        <h1 className="text-3xl font-bold text-purple-400 mb-6">Profile</h1>

        <div className="flex flex-col md:flex-row md:items-center mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <div
              className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6"
              style={{
                animation: animateIn
                  ? "logoBlip 0.5s ease-out forwards"
                  : "none",
              }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2
                className="text-2xl font-semibold text-gray-100"
                style={{
                  opacity: animateIn ? 1 : 0,
                  transform: animateIn ? "translateX(0)" : "translateX(20px)",
                  transition:
                    "opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s",
                }}>
                {user?.username}
              </h2>
            </div>
          </div>

          <div className="md:ml-auto bg-dark-300 rounded-lg p-4">
            <h3 className="flex items-center text-lg font-semibold text-purple-400 mb-3">
              <StarIcon className="mr-2" /> Account Info
            </h3>

            <div className="mb-3 pb-3 border-b border-dark-400">
              <div className="flex items-center text-sm text-gray-300 mb-2">
                <span className="w-24 text-gray-400">Joined:</span>
                <span>{formatJoinDate()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-300 mb-2">
                <span className="w-24 text-gray-400">Comments:</span>
                <span className="flex items-center">
                  <span className="px-2 py-1 bg-purple-900/30 rounded-full text-purple-400 font-medium mr-2">
                    {userComments.length} Comments
                  </span>
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <span className="w-24 text-gray-400">Status:</span>
                <span className="flex items-center">
                  <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                  Active Member
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center text-base font-medium text-gray-200 mb-2">
                <FavoriteIcon
                  fontSize="small"
                  className="mr-2 text-purple-400"
                />
                Favorite Team
              </div>

              {favoriteTeam?.favorite_team_id ? (
                <div className="flex items-center justify-between p-2 bg-dark-400 rounded-md">
                  <div className="flex items-center">
                    <img
                      src={favoriteTeam.favorite_team_crest}
                      alt={favoriteTeam.favorite_team_name}
                      className="w-10 h-10 mr-3 object-contain"
                    />
                    <div className="flex flex-col">
                      <span className="text-gray-200 font-medium">
                        {favoriteTeam.favorite_team_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    {favoriteTeam.favorite_team_league && (
                      <img
                        src={`/icons/${favoriteTeam.favorite_team_league.toLowerCase().replace(/\s+/g, '-')}.png`}
                        alt={favoriteTeam.favorite_team_league}
                        className="w-6 h-6 object-contain mr-2 ml-3"
                        title={favoriteTeam.favorite_team_league}
                      />
                    )}
                    {favoriteTeam.favorite_team_country && (
                      <img
                        src={`/icons/${favoriteTeam.favorite_team_country.toLowerCase()}-flag.png`}
                        alt={favoriteTeam.favorite_team_country}
                        className="w-5 h-5 object-contain mr-3"
                        title={favoriteTeam.favorite_team_country}
                      />
                    )}
                    <button
                      onClick={handleRemoveFavoriteTeam}
                      className="p-2 text-red-400 hover:text-red-300 transition-colors rounded-full hover:bg-dark-500">
                      <CloseIcon fontSize="small" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex mb-2">
                    <input
                      type="text"
                      value={teamSearchQuery}
                      onChange={(e) => setTeamSearchQuery(e.target.value)}
                      placeholder="Search for a team..."
                      className="flex-grow bg-dark-400 text-gray-200 px-3 py-2 rounded-l-md border border-dark-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button
                      onClick={handleTeamSearch}
                      disabled={isSearching}
                      className="bg-purple-600 text-white px-3 py-2 rounded-r-md hover:bg-purple-700 transition-colors flex items-center justify-center min-w-[40px]">
                      {isSearching ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <SearchIcon />
                      )}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-3 max-h-40 overflow-y-auto bg-dark-400 rounded-md">
                      {searchResults.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center p-2 hover:bg-dark-500 cursor-pointer transition-colors"
                          onClick={() => handleFavoriteTeam(team)}>
                          <img
                            src={team.crest}
                            alt={team.name}
                            className="w-6 h-6 mr-2 object-contain"
                          />
                          <span className="text-sm text-gray-200 truncate flex-grow">
                            {team.name}
                          </span>
                          <span className="text-xs text-gray-400 ml-2 px-2 py-1 bg-dark-300 rounded-full">
                            {team.league}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mt-2 flex items-center">
                    <FavoriteIcon fontSize="small" className="mr-1" />
                    Set your favorite team to see their matches first
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="bg-dark-200 rounded-xl p-6 border border-dark-300"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s",
        }}>
        <h2 className="text-2xl font-semibold text-purple-400 mb-6">
          Comments
        </h2>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : userComments.length > 0 ? (
          <div className="space-y-4">
            {userComments.map((comment, index) => (
              <div
                key={comment.id}
                className="bg-dark-300 rounded-lg p-4"
                style={{
                  opacity: animateIn ? 1 : 0,
                  transform: animateIn ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${
                    0.4 + index * 0.1
                  }s, transform 0.5s ease ${0.4 + index * 0.1}s`,
                }}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    {comment.match_details?.homeTeam?.crest && (
                      <img
                        src={comment.match_details.homeTeam.crest}
                        alt=""
                        className="h-6 w-6 object-contain mr-2"
                      />
                    )}
                    <span className="font-semibold">
                      <span className="text-cyan-200 font-bold">
                        {comment.match_details?.homeTeam?.shortName ||
                          (comment.match_details?.homeTeam?.name &&
                            comment.match_details.homeTeam.name
                              .substring(0, 3)
                              .toUpperCase()) ||
                          "?"}
                      </span>
                      <span className="mx-[6px] text-pink-500 font-medium">
                        vs
                      </span>
                      <span className="text-purple-300 font-bold">
                        {comment.match_details?.awayTeam?.shortName ||
                          (comment.match_details?.awayTeam?.name &&
                            comment.match_details.awayTeam.name
                              .substring(0, 3)
                              .toUpperCase()) ||
                          "?"}
                      </span>
                    </span>
                    {comment.match_details?.awayTeam?.crest && (
                      <img
                        src={comment.match_details.awayTeam.crest}
                        alt=""
                        className="h-6 w-6 object-contain ml-2"
                      />
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-400 translate-x-1.5 -translate-y-2">
                    <span>{formatDateTime(comment.created_at)}</span>
                    <button
                      onClick={() => setSelectedMatch(comment.match_details)}
                      className="ml-2 p-1 -translate-y-[1px] text-purple-400 hover:text-purple-300 transition-all duration-200 rounded-full hover:bg-dark-400"
                      title="View match details">
                      <OpenInNewIcon fontSize="small" />
                    </button>
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingComment === comment.id}
                      className={`ml-0.5 p-1 -translate-y-[1px] text-red-400 hover:text-red-300 transition-all duration-200 rounded-full hover:bg-dark-400 ${
                        deletingComment === comment.id
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      title="Delete comment">
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 mt-2 break-words overflow-hidden overflow-wrap-anywhere">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p
            className="text-center text-gray-400 py-8"
            style={{
              opacity: animateIn ? 1 : 0,
              transition: "opacity 0.5s ease 0.4s",
            }}>
            You haven't made any comments yet.
          </p>
        )}
      </div>

      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
}

export default Profile;