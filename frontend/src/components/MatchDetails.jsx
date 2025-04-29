import { useState, useEffect, useRef } from "react";
import { getMatchDetails } from "../services/footballService";
import {
  formatLeagueName,
  getStatusColor,
  getStatusText,
  formatMatchDateTime,
} from "../utils/matchUtils";
import CloseIcon from "@mui/icons-material/Close";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { LEAGUE_ICONS } from "../config/leagueIcons";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import Login from "./Login";
import Register from "./Register";
import { toast } from "react-toastify";
import DeleteIcon from "@mui/icons-material/Delete";
import ReactDOM from "react-dom";
import UserProfile from "./UserProfile";

const formatBulgarianTime = (utcDate) => {
  const date = new Date(utcDate);
  return `${date.toLocaleTimeString("bg-BG", {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const isMatchTimeStarted = (utcDate) => {
  const matchTime = new Date(utcDate);
  const now = new Date();
  const matchEndTime = new Date(matchTime);
  matchEndTime.setHours(matchEndTime.getHours() + 3);

  return now >= matchTime && now <= matchEndTime && !match?.status?.includes("FINISHED");
};

function MatchDetails({ match, isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchingSource, setFetchingSource] = useState(false);
  const [streamUrl, setStreamUrl] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState(null);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [homeTeamEvents, setHomeTeamEvents] = useState([]);
  const [awayTeamEvents, setAwayTeamEvents] = useState([]);
  const [isFutureMatch, setIsFutureMatch] = useState(false);
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

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const extractGoalscorers = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const goalscorers = [];

    const competitors = doc.querySelectorAll(".SoccerPerformers__Competitor");

    competitors.forEach((competitor) => {
      const teamNameEl = competitor.querySelector(
        ".SoccerPerformers__Competitor__Team__Name"
      );
      if (!teamNameEl) return;

      const teamName = teamNameEl.textContent.trim();

      const noGoals = competitor.querySelector(
        ".SoccerPerformers__Competitor__Info__GoalsList--noGoals"
      );
      if (noGoals) {
        return;
      }

      const goalItems = competitor.querySelectorAll(
        ".SoccerPerformers__Competitor__Info__GoalsList__Item"
      );

      goalItems.forEach((item) => {
        const playerEl = item.querySelector(".Soccer__PlayerName");
        const timeEl = item.querySelector(".GoalScore__Time");

        if (playerEl && timeEl) {
          const playerName = playerEl.textContent.trim();
          const time = timeEl.textContent.trim().replace(" - ", "");

          goalscorers.push({
            player: playerName,
            team: teamName,
            time: time,
          });
        }
      });
    });

    return goalscorers;
  };

  useEffect(() => {
    const fetchDetails = async () => {
      if (!match) return;

      setLoading(true);

      setHomeTeamEvents([]);
      setAwayTeamEvents([]);

      try {
        const data = await getMatchDetails(match.id);
        setDetails(data);
        setError(null);

        const matchDate = new Date(match.utcDate);
        const now = new Date();
        const isFutureMatch = matchDate > now;
        setIsFutureMatch(isFutureMatch);

        if (!isFutureMatch) {
          const homeEvents = [];
          const awayEvents = [];

          try {
            const year = matchDate.getFullYear();
            const month = String(matchDate.getMonth() + 1).padStart(2, "0");
            const day = String(matchDate.getDate()).padStart(2, "0");
            const formattedDate = `${year}${month}${day}`;

            const espnUrl = `https://www.espn.com/soccer/scoreboard/_/date/${formattedDate}`;

            const response = await api.get("/matches/fetch-source/", {
              params: { url: espnUrl },
            });

            if (response.data && response.data.source) {
              const homeTeam = match.homeTeam.name;
              const awayTeam = match.awayTeam.name;

              const parser = new DOMParser();
              const doc = parser.parseFromString(
                response.data.source,
                "text/html"
              );

              const cardSections = doc.querySelectorAll(
                "section.Card.gameModules"
              );

              cardSections.forEach((card) => {
                const header = card.querySelector("header.Card__Header");
                if (!header) return;

                const leagueLabel = header.getAttribute("aria-label");
                if (!leagueLabel) return;

                const top5Leagues = [
                  "English Premier League",
                  "Spanish LALIGA",
                  "German Bundesliga",
                  "Italian Serie A",
                  "French Ligue 1",
                  "UEFA Champions League",
                  "UEFA Europa League",
                ];

                if (
                  !top5Leagues.some((league) => leagueLabel.includes(league))
                ) {
                  return;
                }

                const teams = card.querySelectorAll(
                  ".SoccerPerformers__Competitor__Team__Name"
                );

                for (let i = 0; i < teams.length; i++) {
                  const teamName = teams[i].textContent.trim();

                  if (
                    teamName.includes(homeTeam) ||
                    homeTeam.includes(teamName) ||
                    teamName.includes(awayTeam) ||
                    awayTeam.includes(teamName)
                  ) {
                    const competitorSection = teams[i].closest(
                      ".SoccerPerformers__Competitor"
                    );
                    if (!competitorSection) continue;

                    const isHomeTeam =
                      teamName.includes(homeTeam) ||
                      homeTeam.includes(teamName);
                    const eventsArray = isHomeTeam ? homeEvents : awayEvents;

                    const goalInfos = competitorSection.querySelectorAll(
                      ".SoccerPerformers__Competitor__Info"
                    );

                    goalInfos.forEach((infoSection) => {
                      const isRedCard = infoSection.querySelector(
                        ".SoccerPerformers__RedCardIcon"
                      );

                      if (isRedCard) {
                        const redCardItems = infoSection.querySelectorAll(
                          ".SoccerPerformers__Competitor__Info__GoalsList__Item"
                        );
                        redCardItems.forEach((item) => {
                          const playerEl = item.querySelector(
                            ".Soccer__PlayerName"
                          );
                          const timeEl = item.querySelector(".GoalScore__Time");

                          if (playerEl && timeEl) {
                            const playerName = playerEl.textContent.trim();
                            const time = timeEl.textContent
                              .trim()
                              .replace(" - ", "");

                            eventsArray.push({
                              type: "red",
                              player: playerName,
                              time: time,
                            });
                          }
                        });
                      } else if (
                        infoSection.querySelector(".SoccerPerformers__GoalIcon")
                      ) {
                        const noGoals = infoSection.querySelector(
                          ".SoccerPerformers__Competitor__Info__GoalsList--noGoals"
                        );
                        if (noGoals) {
                          return;
                        }

                        const goalItems = infoSection.querySelectorAll(
                          ".SoccerPerformers__Competitor__Info__GoalsList__Item"
                        );

                        goalItems.forEach((item) => {
                          const playerEl = item.querySelector(
                            ".Soccer__PlayerName"
                          );
                          const timeEl = item.querySelector(".GoalScore__Time");

                          if (playerEl && timeEl) {
                            const playerName = playerEl.textContent.trim();
                            const time = timeEl.textContent
                              .trim()
                              .replace(" - ", "");

                            if (time.includes("OG")) {
                              eventsArray.push({
                                type: "own",
                                player: playerName,
                                time: time.replace("OG", "").trim(),
                              });
                            } else {
                              eventsArray.push({
                                type: "goal",
                                player: playerName,
                                time: time,
                              });
                            }
                          }
                        });
                      }
                    });
                  }
                }
              });

              setHomeTeamEvents(homeEvents);
              setAwayTeamEvents(awayEvents);
            }
          } catch (espnError) {
            console.error("Error fetching ESPN data:", espnError);
          }
        }
      } catch (err) {
        setError("Failed to load match details");
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && match) {
      fetchDetails();
    } else {
      setStreamUrl(null);
      setIsFullscreen(false);
    }
  }, [isOpen, match]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleWatchButtonClick = async (e) => {
    e.preventDefault();

    if (!match) return;

    setFetchingSource(true);

    try {
      const matchDate = new Date(match.utcDate);
      matchDate.setHours(matchDate.getHours() + 2);
      const adjustedMatchDate = matchDate.toISOString();

      const response = await api.get(`/matches/stream-embed/`, {
        params: {
          home_team: match.homeTeam.shortName || match.homeTeam.name,
          away_team: match.awayTeam.shortName || match.awayTeam.name,
          match_date: adjustedMatchDate,
        },
      });

      if (response.data && response.data.stream_url) {
        setStreamUrl(response.data.stream_url);
      } else {
        const homeTeam = match.homeTeam.shortName || match.homeTeam.name;
        const awayTeam = match.awayTeam.shortName || match.awayTeam.name;
        toast.info(`Stream not available for ${homeTeam} vs ${awayTeam}`, {
          icon: "🎬",
        });
      }
    } catch (err) {
      console.error("Error fetching stream:", err);
      toast.error("Failed to load match stream");
    } finally {
      setFetchingSource(false);
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      if (!match) return;
      setLoadingComments(true);
      try {
        const response = await api.get(`/comments/${match.id}/`);
        setComments(response.data);
      } catch (err) {
        console.error("Failed to load comments", err);
      } finally {
        setLoadingComments(false);
      }
    };

    if (isOpen && match) {
      fetchComments();
    }
  }, [isOpen, match]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !isAuthenticated) return;

    try {
      const response = await api.post(`/comments/${match.id}/`, {
        content: newComment,
      });
      setComments([response.data, ...comments]);
      setNewComment("");
      toast.success("Comment posted successfully!");
    } catch (err) {
      console.error("Failed to post comment", err);

      if (err.response) {
        console.error("Error response:", err.response.data);
      }

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error(
          "Authentication required to post comments. Please log in again."
        );
        setShowLogin(true);
      } else {
        toast.error("Failed to post your comment. Please try again.");
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/delete/${commentId}/`);
      setComments(comments.filter((comment) => comment.id !== commentId));
      toast.success("Comment deleted successfully!");
    } catch (err) {
      console.error("Failed to delete comment", err);
      toast.error("Failed to delete your comment. Please try again.");
    }
  };

  const handleUsernameClick = (username) => {
    setSelectedUsername(username);
    setShowUserProfile(true);
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        if (showUserProfile) {
          setShowUserProfile(false);
        } else {
          handleClose();
        }
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [showUserProfile]);

  if (!match) return null;

  return ReactDOM.createPortal(
    <>
      <div
        className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50 bg-black/60 transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        style={{
          animation: isClosing ? "none" : "fadeIn 0.3s ease-out forwards",
        }}
        onClick={handleClose}
      />

      {loading ? (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent"></div>
        </div>
      ) : (
        <div
          className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl transition-all duration-300 ${
            isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100"
          }`}>
          <div
            className={`bg-dark-200 rounded-xl ${
              isFullscreen ? "w-screen h-screen fixed inset-0" : ""
            } p-6 max-h-[90vh] overflow-y-auto border border-dark-300`}
            style={{ animation: isClosing ? "none" : "scaleIn 0.3s ease-out" }}
            onClick={(e) => e.stopPropagation()}>
            {error ? (
              <div className="text-red-400 text-center py-8">{error}</div>
            ) : (
              <>
                {streamUrl ? (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-purple-400">
                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}{" "}
                        - Live Stream
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={toggleFullscreen}
                          className="text-gray-400 hover:text-white p-1 rounded-full transition-colors">
                          {isFullscreen ? (
                            <FullscreenExitIcon />
                          ) : (
                            <FullscreenIcon />
                          )}
                        </button>
                        <button
                          onClick={() => setStreamUrl(null)}
                          className="text-gray-400 hover:text-white p-1 rounded-full transition-colors">
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                    <div
                      className={`overflow-hidden ${
                        isFullscreen ? "h-[calc(100vh-120px)]" : "aspect-video"
                      }`}>
                      <iframe
                        src={streamUrl}
                        title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
                        className="w-full h-full border-0"
                        allowFullScreen
                        sandbox="allow-scripts allow-same-origin"
                        referrerPolicy="no-referrer"></iframe>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="bg-dark-100 rounded-lg p-6 overflow-hidden max-h-full">
                      <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center space-x-3">
                          {match.competition &&
                          LEAGUE_ICONS[match.competition.id] ? (
                            <img
                              src={LEAGUE_ICONS[match.competition.id]}
                              alt=""
                              className="w-8 h-8 object-contain"
                            />
                          ) : null}
                          <h2 className="text-2xl font-bold text-purple-400">
                            {match.competition
                              ? formatLeagueName(match.competition.name)
                              : ""}
                          </h2>
                        </div>
                        <button
                          onClick={handleClose}
                          className="text-gray-400 hover:text-gray-200 transition-colors">
                          <CloseIcon />
                        </button>
                      </div>

                      <div className="flex justify-center mb-6">
                        <a
                          href={streamUrl ? "#" : "#"}
                          onClick={(e) => {
                            e.preventDefault();
                            if (
                              (isMatchTimeStarted(match.utcDate) ||
                                match.status === "IN_PLAY" ||
                                match.status === "PAUSED") &&
                              match.status !== "FINISHED"
                            ) {
                              handleWatchButtonClick(e);
                            }
                            return false;
                          }}
                          className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 text-sm
                          ${
                            (isMatchTimeStarted(match.utcDate) ||
                              match.status === "IN_PLAY" ||
                              match.status === "PAUSED") &&
                            match.status !== "FINISHED"
                              ? "bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                              : match.status === "FINISHED"
                              ? "bg-dark-400 text-gray-400 cursor-not-allowed pointer-events-none"
                              : "bg-dark-300 text-gray-400 cursor-not-allowed pointer-events-none"
                          }`}>
                          <PlayArrowIcon className="w-4 h-4 mr-2" />
                          <span>
                            {fetchingSource 
                              ? "Loading..." 
                              : match.status === "FINISHED"
                              ? "Match has ended"
                              : isMatchTimeStarted(match.utcDate)
                              ? "Watch Live"
                              : `Watch at ${formatMatchDateTime(match.utcDate)}`}
                          </span>
                        </a>
                      </div>

                      <div className="flex justify-center mb-6">
                        <div
                          className={`px-3 py-1 text-sm rounded-md ${getStatusColor(
                            match.status
                          )}`}>
                          {match.matchStatus
                            ? match.matchStatus
                            : match.status === "FINISHED"
                            ? "FT"
                            : getStatusText(match.status, match.utcDate)}
                        </div>
                      </div>

                      {(() => {
                        const maxEvents = Math.max(
                          homeTeamEvents.length,
                          awayTeamEvents.length
                        );
                        const baseHeight = 20;
                        const eventHeight = 18;
                        const dynamicPadding =
                          maxEvents > 0
                            ? baseHeight + maxEvents * eventHeight
                            : baseHeight;

                        let homeScore = 0;
                        let awayScore = 0;

                        homeTeamEvents.forEach((event) => {
                          if (event.type === "goal") {
                            homeScore += 1;

                            const commas = (event.time.match(/,/g) || [])
                              .length;
                            if (commas > 0) {
                              homeScore += commas;
                            }
                          }
                        });

                        awayTeamEvents.forEach((event) => {
                          if (event.type === "goal") {
                            awayScore += 1;

                            const commas = (event.time.match(/,/g) || [])
                              .length;
                            if (commas > 0) {
                              awayScore += commas;
                            }
                          }
                        });

                        homeTeamEvents.forEach((event) => {
                          if (event.type === "own") {
                            awayScore += 1;
                            const commas = (event.time.match(/,/g) || [])
                              .length;
                            if (commas > 0) {
                              awayScore += commas;
                            }
                          }
                        });

                        awayTeamEvents.forEach((event) => {
                          if (event.type === "own") {
                            homeScore += 1;

                            const commas = (event.time.match(/,/g) || [])
                              .length;
                            if (commas > 0) {
                              homeScore += commas;
                            }
                          }
                        });

                        const displayHomeScore =
                          homeTeamEvents.length > 0 || awayTeamEvents.length > 0
                            ? homeScore
                            : match.score?.fullTime?.home ?? 0;

                        const displayAwayScore =
                          homeTeamEvents.length > 0 || awayTeamEvents.length > 0
                            ? awayScore
                            : match.score?.fullTime?.away ?? 0;

                        return (
                          <div
                            className="flex items-center justify-between mb-8 relative"
                            style={{ paddingBottom: `${dynamicPadding}px` }}>
                            <div className="flex-1 flex flex-col items-center">
                              <img
                                src={match.homeTeam.crest}
                                alt=""
                                className="w-20 h-20 object-contain mb-3"
                              />
                              <div className="font-medium text-lg text-center mb-2">
                                {match.homeTeam.name}
                              </div>
                              {homeTeamEvents.length > 0 && (
                                <div
                                  className="absolute w-1/3 text-sm"
                                  style={{
                                    top: "150px",
                                    left: "16.67%",
                                    transform: "translateX(-45%)",
                                  }}>
                                  {homeTeamEvents.map((event, idx) => {
                                    const formattedPlayer =
                                      event.player.replace(/^([A-Z]) /, "$1. ");
                                    const formattedTime = event.time.replace(
                                      / - /,
                                      " "
                                    );

                                    return (
                                      <div
                                        key={idx}
                                        className="text-gray-300 flex items-center justify-center mb-1">
                                        <span>
                                          {formattedPlayer} {formattedTime}
                                          {event.type === "own" && " (OG)"}
                                        </span>
                                        {event.type === "goal" && (
                                          <img
                                            src="/icons/goal.png"
                                            alt="Goal"
                                            className="w-4 h-4 ml-2"
                                          />
                                        )}
                                        {event.type === "own" && (
                                          <img
                                            src="/icons/owngoal.png"
                                            alt="Own Goal"
                                            className="w-6 h-6 ml-2"
                                          />
                                        )}
                                        {event.type === "red" && (
                                          <svg
                                            width="12"
                                            height="16"
                                            viewBox="0 0 10 14"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="ml-2 mt-1.5">
                                            <path
                                              d="M6.81836 0.605469H3.182C2.42888 0.605469 1.81836 1.21599 1.81836 1.96911V8.02956C1.81836 8.78268 2.42888 9.3932 3.182 9.3932H6.81836C7.57148 9.3932 8.182 8.78268 8.182 8.02956V1.96911C8.182 1.21599 7.57148 0.605469 6.81836 0.605469Z"
                                              fill="#DD3636"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            <div className="text-6xl font-bold text-purple-400 mx-6 -translate-y-6">
                              {displayHomeScore} - {displayAwayScore}
                            </div>

                            <div className="flex-1 flex flex-col items-center">
                              <img
                                src={match.awayTeam.crest}
                                alt=""
                                className="w-20 h-20 object-contain mb-3"
                              />
                              <div className="font-medium text-lg text-center mb-2">
                                {match.awayTeam.name}
                              </div>
                              {awayTeamEvents.length > 0 && (
                                <div
                                  className="absolute w-1/3 text-sm"
                                  style={{
                                    top: "150px",
                                    right: "16.67%",
                                    transform: "translateX(46%)",
                                  }}>
                                  {awayTeamEvents.map((event, idx) => {
                                    const formattedPlayer =
                                      event.player.replace(/^([A-Z]) /, "$1. ");
                                    const formattedTime = event.time.replace(
                                      / - /,
                                      " "
                                    );

                                    return (
                                      <div
                                        key={idx}
                                        className="text-gray-300 flex items-center justify-center mb-1">
                                        <span>
                                          {formattedPlayer} {formattedTime}
                                          {event.type === "own" && " (OG)"}
                                        </span>
                                        {event.type === "goal" && (
                                          <img
                                            src="/icons/goal.png"
                                            alt="Goal"
                                            className="w-4 h-4 ml-2"
                                          />
                                        )}
                                        {event.type === "own" && (
                                          <img
                                            src="/icons/owngoal.png"
                                            alt="Own Goal"
                                            className="w-6 h-6 ml-2"
                                          />
                                        )}
                                        {event.type === "red" && (
                                          <svg
                                            width="12"
                                            height="16"
                                            viewBox="0 0 10 14"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="ml-2 mt-1.5">
                                            <path
                                              d="M6.81836 0.605469H3.182C2.42888 0.605469 1.81836 1.21599 1.81836 1.96911V8.02956C1.81836 8.78268 2.42888 9.3932 3.182 9.3932H6.81836C7.57148 9.3932 8.182 8.78268 8.182 8.02956V1.96911C8.182 1.21599 7.57148 0.605469 6.81836 0.605469Z"
                                              fill="#DD3636"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}

                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">
                    Comments
                  </h3>

                  {isAuthenticated && (
                    <form className="mb-6" onSubmit={handleCommentSubmit}>
                      <textarea
                        className="w-full bg-dark-300 text-gray-200 p-3 rounded-lg border border-dark-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Add your comment..."
                        rows="3"
                        value={newComment}
                        onChange={(e) =>
                          setNewComment(e.target.value)
                        }></textarea>
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 transition-colors text-white rounded-lg font-medium">
                        Post Comment
                      </button>
                    </form>
                  )}

                  {loadingComments ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                    </div>
                  ) : comments.length > 0 ? (
                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="bg-dark-300 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <button
                                className="font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                                onClick={() =>
                                  handleUsernameClick(comment.username)
                                }>
                                {comment.username}
                              </button>
                            </div>
                            <div className="flex items-center text-sm text-gray-400 -translate-y-[1px]">
                              <span>
                                {new Date(comment.created_at).toLocaleString()}
                              </span>
                              {user && user.username === comment.username && (
                                <button
                                  onClick={() =>
                                    handleDeleteComment(comment.id)
                                  }
                                  className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors rounded-full hover:bg-dark-400"
                                  title="Delete comment">
                                  <DeleteIcon fontSize="small" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-300 mt-2 break-words overflow-hidden overflow-wrap-anywhere">
                            {comment.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-4">
                      No comments yet. Be the first to share your thoughts!
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
      <UserProfile
        username={selectedUsername}
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />
    </>,
    document.body
  );
}

export default MatchDetails;
