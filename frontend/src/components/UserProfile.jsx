import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import CloseIcon from "@mui/icons-material/Close";
import FavoriteIcon from "@mui/icons-material/Favorite";
import StarIcon from "@mui/icons-material/Star";
import CommentIcon from "@mui/icons-material/Comment";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { toast } from "react-toastify";
import ReactDOM from "react-dom";
import MatchDetails from "./MatchDetails";

function UserProfile({ username, isOpen, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setAnimateIn(true);
    
    if (isOpen) {
      setShowComments(false);
      setUserComments([]);
    }
    
    const fetchProfile = async () => {
      if (!username || !isOpen) return;
      
      setLoading(true);
      try {
        const response = await api.get(`/users/profile/${username}/`);
        setProfile(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to load profile");
        toast.error("Could not load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [username, isOpen]);

  const fetchUserComments = async () => {
    if (!username || !isOpen || loadingComments) return;
    
    setLoadingComments(true);
    try {
      const response = await api.get(`/comments/user/${username}/`);
      setUserComments(response.data);
      setShowComments(true);
    } catch (err) {
      toast.error("Could not load user comments");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleViewComments = () => {
    if (userComments.length === 0) {
      fetchUserComments();
    } else {
      setShowComments(!showComments);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };
  
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50 bg-black/60 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{ animation: isClosing ? "none" : "fadeIn 0.3s ease-out" }}
        onClick={handleClose}
      />
      <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-all duration-300 ${
        isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
      }`}>
        <div
          className="bg-dark-200 rounded-xl p-6 border border-dark-300"
          style={{ animation: isClosing ? "none" : "scaleIn 0.3s ease-out" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-purple-400">User Profile</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          ) : error ? (
            <div className="bg-red-900/20 border border-red-500 text-red-400 p-4 rounded-md">
              {error}
            </div>
          ) : profile ? (
            <div className="space-y-6">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mr-4">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-100">
                    {profile.username}
                  </h3>
                </div>
              </div>

              <div className="bg-dark-300 rounded-lg p-4">
                <h4 className="flex items-center text-base font-semibold text-purple-400 mb-3">
                  <StarIcon className="mr-2" /> Account Info
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-32 text-gray-400">Joined:</span>
                    <span className="-ml-20">{formatDate(profile.join_date)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="w-32 text-gray-400">Total Comments:</span>
                    <span className="-ml-5 px-2 py-1 bg-purple-900/30 rounded-full text-purple-400 font-medium">
                      {profile.comment_count}
                    </span>
                  </div>
                </div>
              </div>

              {profile.favorite_team && profile.favorite_team.id && (
                <div className="bg-dark-300 rounded-lg p-4">
                  <h4 className="flex items-center text-base font-semibold text-purple-400 mb-3">
                    <FavoriteIcon className="mr-2" /> Favorite Team
                  </h4>
                  
                  <div className="flex items-center justify-between p-2 bg-dark-400 rounded-md">
                    <div className="flex items-center">
                      <img
                        src={profile.favorite_team.crest}
                        alt={profile.favorite_team.name}
                        className="w-10 h-10 mr-3 object-contain"
                      />
                      <span className="text-gray-200">{profile.favorite_team.name}</span>
                    </div>
                    <div className="flex items-center">
                      {profile.favorite_team_league && (
                        <img
                          src={`/icons/${profile.favorite_team_league.toLowerCase().replace(/\s+/g, '-')}.png`}
                          alt={profile.favorite_team_league}
                          className="w-6 h-6 object-contain mr-2 ml-3"
                          title={profile.favorite_team_league}
                        />
                      )}
                      {profile.favorite_team_country && (
                        <img
                          src={`/icons/${profile.favorite_team_country.toLowerCase()}-flag.png`}
                          alt={profile.favorite_team_country}
                          className="w-6 h-6 object-contain mr-3"
                          title={profile.favorite_team_country}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleViewComments}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 transition-colors rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loadingComments || profile.comment_count === 0}
                >
                  <CommentIcon />
                  <span>
                    {loadingComments 
                      ? "Loading..." 
                      : showComments
                      ? "Hide Comments"
                      : `View ${profile.comment_count} Comments`}
                  </span>
                </button>
              </div>

              {showComments && (
                <div className="bg-dark-300 rounded-lg p-4 mt-4">
                  <h4 className="text-lg font-semibold text-purple-400 mb-4">
                    Comments
                  </h4>
                  
                  {loadingComments ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-500 border-t-transparent"></div>
                    </div>
                  ) : userComments.length > 0 ? (
                    <div className="space-y-4">
                      {userComments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-dark-400 rounded-lg p-4"
                        >
                          <div className="flex items-center mb-2">
                            {comment.match_details?.homeTeam?.crest && (
                              <img
                                src={comment.match_details.homeTeam.crest}
                                alt=""
                                className="h-8 w-8 object-contain mr-2"
                              />
                            )}
                            <span className="font-semibold text-lg">
                              <span className="text-cyan-200 font-bold">
                                {comment.match_details?.homeTeam?.shortName || "?"}
                              </span>
                              <span className="mx-2 text-pink-500 font-medium">
                                vs
                              </span>
                              <span className="text-purple-300 font-bold">
                                {comment.match_details?.awayTeam?.shortName || "?"}
                              </span>
                            </span>
                            {comment.match_details?.awayTeam?.crest && (
                              <img
                                src={comment.match_details.awayTeam.crest}
                                alt=""
                                className="h-8 w-8 object-contain ml-2"
                              />
                            )}
                            <div className="ml-auto flex items-center text-sm text-gray-400">
                              <span>{formatDateTime(comment.created_at)}</span>
                              <button
                                onClick={() => setSelectedMatch(comment.match_details)}
                                className="ml-2 p-1 text-purple-400 hover:text-purple-300 transition-all duration-200 rounded-full hover:bg-dark-500"
                                title="View match details"
                              >
                                <OpenInNewIcon fontSize="small" />
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-300 mt-2 text-base break-words overflow-hidden overflow-wrap-anywhere">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-4">
                      This user hasn't made any comments yet.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              User not found
            </div>
          )}
        </div>
      </div>
      
      {selectedMatch && (
        <MatchDetails
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </>,
    document.body
  );
}

export default UserProfile;