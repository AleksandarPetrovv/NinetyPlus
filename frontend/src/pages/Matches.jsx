import { useEffect, useRef, useState } from "react";
import { getMatches } from "../services/footballService";
import { TOP_LEAGUES } from "../config/leagues";
import MatchDetails from "../components/MatchDetails";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { LEAGUE_ICONS } from "../config/leagueIcons";
import {
  formatLeagueName,
  getStatusColor,
  getStatusTextSync,
} from "../utils/matchUtils";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function MatchCard({ match, onClick, isFavorite, favoriteTeam }) {
  const matchDate = new Date(match.utcDate);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const isYesterdayOrBefore = matchDate <= yesterday;
  const shouldShowScore = match.status === "FINISHED" || isYesterdayOrBefore;

  return (
    <div
      onClick={() => onClick(match)}
      className={`bg-dark-200 rounded-xl ${
        isFavorite ? "rounded-t-none" : ""
      } shadow-md hover:shadow-purple-900/30 hover:bg-dark-300 transition-all duration-200 border ${
        isFavorite ? "border-purple-800" : "border-dark-300"
      }`}>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 justify-end mr-8">
            <span
              className={`text-lg font-bold ${
                match.homeTeam.id === favoriteTeam?.favorite_team_id
                  ? "text-purple-400"
                  : "text-gray-100"
              }`}>
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
            <img
              src={match.homeTeam.crest}
              alt=""
              className="w-12 h-12 object-contain ml-4"
            />
          </div>

          <div className="flex flex-col items-center">
            {match.status !== "TIMED" && match.status !== "SCHEDULED" && (
              <div
                className={`px-3 py-1 text-sm rounded-md mb-2 ${getStatusColor(
                  match.status
                )}`}>
                {getStatusTextSync(match.status, match.utcDate)}
              </div>
            )}
            <div className={`text-3xl font-bold text-purple-400 flex items-center ${
              (!shouldShowScore && (match.status === "TIMED" || match.status === "SCHEDULED")) && 
              getStatusTextSync(match.status, match.utcDate).includes(",") 
                ? "text-xl"
                : ""
            }`}>
              {!shouldShowScore && (match.status === "TIMED" || match.status === "SCHEDULED")
                ? getStatusTextSync(match.status, match.utcDate)
                : <span className="mb-8">{match.score.fullTime.home} - {match.score.fullTime.away}</span>}
            </div>
          </div>

          <div className="flex items-center flex-1 justify-start ml-8">
            <img
              src={match.awayTeam.crest}
              alt=""
              className="w-12 h-12 object-contain mr-4"
            />
            <span
              className={`text-lg font-bold ${
                match.awayTeam.id === favoriteTeam?.favorite_team_id
                  ? "text-purple-400"
                  : "text-gray-100"
              }`}>
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const { favoriteTeam } = useAuth();
  const prevMatchesRef = useRef(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [favoriteTeamMatch, setFavoriteTeamMatch] = useState(null);
  const [noMatches, setNoMatches] = useState(false);
  
  useEffect(() => {
    setAnimateIn(true);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (initialLoad) {
        setLoading(true);
      }
      
      try {
        const allMatchesData = await getMatches();
        
        if (!isMounted) return;
        
        if (!allMatchesData) {
          setIsRateLimited(true);
          return;
        }

        let favoriteTeamMatch = null;
        if (favoriteTeam && favoriteTeam.favorite_team_id) {
          
          if (allMatchesData && allMatchesData.length > 0) {
            favoriteTeamMatch = allMatchesData.find(
              (match) =>
                match.homeTeam.id === favoriteTeam.favorite_team_id ||
                match.awayTeam.id === favoriteTeam.favorite_team_id
            );
          }
          
          if (!favoriteTeamMatch) {
            try {
              const response = await api.get(`/matches/team/${favoriteTeam.favorite_team_id}/`);
              
              if (response.data && response.data.matches && response.data.matches.length > 0) {
                const upcomingMatches = response.data.matches
                  .filter(match => match.status === "SCHEDULED" || match.status === "TIMED")
                  .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
                
                if (upcomingMatches.length > 0) {
                  favoriteTeamMatch = upcomingMatches[0];
                }
              }
            } catch (err) {
              console.error("Failed to fetch favorite team's upcoming match", err);
            }
          }
        }
        
        if (allMatchesData.length === 0) {
          setNoMatches(true);
          setFavoriteTeamMatch(favoriteTeamMatch);
          return;
        }
        
        setIsRateLimited(false);
        setNoMatches(false);
        
        const matchesByCompetition = {};
        
        allMatchesData.forEach(match => {
          const competitionId = match.competition.id;
          if (!matchesByCompetition[competitionId]) {
            matchesByCompetition[competitionId] = [];
          }
          matchesByCompetition[competitionId].push(match);
        });
        
        const leagueOrder = [2021, 2014, 2002, 2019, 2015, 2001, 2146];
        
        const allProcessedMatches = [];

        if (favoriteTeamMatch) {
          allProcessedMatches.push(favoriteTeamMatch);

          const competitionId = favoriteTeamMatch.competition.id;
          if (matchesByCompetition[competitionId]) {
            matchesByCompetition[competitionId] = matchesByCompetition[competitionId].filter(
              match => match.id !== favoriteTeamMatch.id
            );
          }
        }
        
        leagueOrder.forEach(competitionId => {
          if (matchesByCompetition[competitionId]) {
            allProcessedMatches.push(...matchesByCompetition[competitionId]);
          }
        });
        
        Object.keys(matchesByCompetition)
          .map(Number)
          .filter(id => !leagueOrder.includes(id))
          .forEach(competitionId => {
            allProcessedMatches.push(...matchesByCompetition[competitionId]);
          });
        
        if (JSON.stringify(allProcessedMatches) !== JSON.stringify(prevMatchesRef.current)) {
          prevMatchesRef.current = allProcessedMatches;
          setMatches(allProcessedMatches);
          
          setFavoriteTeamMatch(favoriteTeamMatch);
        }
      } catch (err) {
        console.error("Error fetching matches:", err);
        
        if (!isMounted) return;
        
        if (err.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          setError("Failed to load matches");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setInitialLoad(false);
        }
      }
    };
    
    fetchData();
    
    const interval = setInterval(fetchData, 180000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [favoriteTeam]);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );

  if (isRateLimited)
    return (
      <div className="col-span-2 p-8 text-center bg-yellow-50 rounded-xl border border-yellow-200">
        <AccessTimeIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          API Rate Limit Reached
        </h3>
        <p className="text-yellow-600">
          Please wait 60 seconds. The API rate limit is 10 calls / minute.
        </p>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="text-red-500 text-center">
          <ErrorOutlineIcon className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );

  if (noMatches) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        {favoriteTeam && favoriteTeamMatch && (
          <div
            className="mb-8"
            style={{
              opacity: animateIn ? 1 : 0,
              transform: animateIn ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s",
            }}>
            <div className="flex items-center bg-purple-900/30 p-2 rounded-t-lg border-t border-l border-r border-purple-800">
              <FavoriteIcon className="text-purple-400 mr-2" />
              <span className="text-sm text-purple-400 font-semibold">
                Your favorite team's upcoming match
              </span>
            </div>
            <div 
              className="bg-dark-200 rounded-b-xl p-4 border border-purple-800 cursor-pointer hover:bg-dark-300 transition-colors"
              onClick={() => setSelectedMatch(favoriteTeamMatch)}>
              <div className="border-b border-dark-400 px-4 py-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={LEAGUE_ICONS[favoriteTeamMatch.competition.id] || "/icons/favicon800x800.png"}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-lg font-bold text-purple-400">
                    {formatLeagueName(favoriteTeamMatch.competition.name)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 justify-end mr-8">
                    <span className={`text-lg font-bold ${
                      favoriteTeamMatch.homeTeam.id === favoriteTeam.favorite_team_id
                        ? "text-purple-400"
                        : "text-gray-100"
                    }`}>
                      {favoriteTeamMatch.homeTeam.shortName || favoriteTeamMatch.homeTeam.name}
                    </span>
                    <img
                      src={favoriteTeamMatch.homeTeam.crest}
                      alt=""
                      className="w-12 h-12 object-contain ml-4"
                    />
                  </div>

                  <div className="flex flex-col items-center">
                    {favoriteTeamMatch.status !== "TIMED" && favoriteTeamMatch.status !== "SCHEDULED" && (
                      <div
                        className={`px-3 py-1 text-sm rounded-md mb-2 ${getStatusColor(
                          favoriteTeamMatch.status
                        )}`}>
                        {getStatusTextSync(favoriteTeamMatch.status, favoriteTeamMatch.utcDate)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-purple-400 flex items-center">
                      {(() => {
                        const matchDate = new Date(favoriteTeamMatch.utcDate);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        
                        const isYesterdayOrBefore = matchDate <= yesterday;
                        const shouldShowScore = favoriteTeamMatch.status === "FINISHED" || isYesterdayOrBefore;
                        
                        if (!shouldShowScore && (favoriteTeamMatch.status === "TIMED" || favoriteTeamMatch.status === "SCHEDULED")) {
                          return getStatusTextSync(favoriteTeamMatch.status, favoriteTeamMatch.utcDate);
                        } else {
                          return <span className="mb-8">{favoriteTeamMatch.score.fullTime.home} - {favoriteTeamMatch.score.fullTime.away}</span>;
                        }
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center flex-1 justify-start ml-8">
                    <img
                      src={favoriteTeamMatch.awayTeam.crest}
                      alt=""
                      className="w-12 h-12 object-contain mr-4"
                    />
                    <span className={`text-lg font-bold ${
                      favoriteTeamMatch.awayTeam.id === favoriteTeam.favorite_team_id
                        ? "text-purple-400"
                        : "text-gray-100"
                    }`}>
                      {favoriteTeamMatch.awayTeam.shortName || favoriteTeamMatch.awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="col-span-2 p-6 text-center bg-dark-200 rounded-xl border border-purple-800">
          <h3 className="text-2xl font-semibold text-purple-500 mb-2">
            We have no matches to show you today!
          </h3>
        </div>
        
        <MatchDetails
          match={selectedMatch}
          isOpen={!!selectedMatch}
          onClose={() => setSelectedMatch(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid gap-4 mb-8">

        {favoriteTeam && favoriteTeamMatch && (
          <div
            className="mb-16"
            style={{
              opacity: animateIn ? 1 : 0,
              transform: animateIn ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 0.55s ease 0.1s, transform 0.55s ease 0.1s",
            }}>
            <div className="flex items-center bg-purple-900/30 p-2 rounded-t-lg border-t border-l border-r border-purple-800">
              <FavoriteIcon className="text-purple-400 mr-2" />
              <span className="text-sm text-purple-400 font-semibold">
                Your favorite team's match
              </span>
            </div>
            <div 
              className="bg-dark-200 rounded-b-xl p-4 border border-purple-800 cursor-pointer hover:bg-dark-300 transition-colors"
              onClick={() => setSelectedMatch(favoriteTeamMatch)}>
              <div className="border-b border-dark-400 px-4 py-3">
                <div className="flex items-center space-x-3">
                  <img
                    src={LEAGUE_ICONS[favoriteTeamMatch.competition.id] || "/icons/favicon800x800.png"}
                    alt=""
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-lg font-bold text-purple-400">
                    {formatLeagueName(favoriteTeamMatch.competition.name)}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 justify-end mr-8">
                    <span className={`text-lg font-bold ${
                      favoriteTeamMatch.homeTeam.id === favoriteTeam.favorite_team_id
                        ? "text-purple-400"
                        : "text-gray-100"
                    }`}>
                      {favoriteTeamMatch.homeTeam.shortName || favoriteTeamMatch.homeTeam.name}
                    </span>
                    <img
                      src={favoriteTeamMatch.homeTeam.crest}
                      alt=""
                      className="w-12 h-12 object-contain ml-4"
                    />
                  </div>

                  <div className="flex flex-col items-center">
                    {favoriteTeamMatch.status !== "TIMED" && favoriteTeamMatch.status !== "SCHEDULED" && (
                      <div
                        className={`px-3 py-1 text-sm rounded-md mb-2 ${getStatusColor(
                          favoriteTeamMatch.status
                        )}`}>
                        {getStatusTextSync(favoriteTeamMatch.status, favoriteTeamMatch.utcDate)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-purple-400 flex items-center">
                      {(() => {
                        const matchDate = new Date(favoriteTeamMatch.utcDate);
                        const today = new Date();
                        const yesterday = new Date();
                        yesterday.setDate(today.getDate() - 1);
                        
                        const isYesterdayOrBefore = matchDate <= yesterday;
                        const shouldShowScore = favoriteTeamMatch.status === "FINISHED" || isYesterdayOrBefore;
                        
                        if (!shouldShowScore && (favoriteTeamMatch.status === "TIMED" || favoriteTeamMatch.status === "SCHEDULED")) {
                          return getStatusTextSync(favoriteTeamMatch.status, favoriteTeamMatch.utcDate);
                        } else {
                          return <span className="mb-8">{favoriteTeamMatch.score.fullTime.home} - {favoriteTeamMatch.score.fullTime.away}</span>;
                        }
                      })()}
                    </div>
                  </div>

                  <div className="flex items-center flex-1 justify-start ml-8">
                    <img
                      src={favoriteTeamMatch.awayTeam.crest}
                      alt=""
                      className="w-12 h-12 object-contain mr-4"
                    />
                    <span className={`text-lg font-bold ${
                      favoriteTeamMatch.awayTeam.id === favoriteTeam.favorite_team_id
                        ? "text-purple-400"
                        : "text-gray-100"
                    }`}>
                      {favoriteTeamMatch.awayTeam.shortName || favoriteTeamMatch.awayTeam.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {(() => {
            let currentCompetition = null; 
            let elements = [];    
            matches.forEach((match, index) => {
              if (favoriteTeamMatch && match.id === favoriteTeamMatch.id) {
                return;
              }

              if (!currentCompetition || currentCompetition !== match.competition.id) {
                currentCompetition = match.competition.id;            
                elements.push(
                  <div key={`league-${match.competition.id}`} className="bg-dark-300 rounded-t-lg p-3 mt-8 first:mt-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={LEAGUE_ICONS[match.competition.id]}
                        alt=""
                        className="w-6 h-6 object-contain"
                      />
                      <span className="font-bold text-gray-200">
                        {match.competition.country ? `${match.competition.country} - ` : ''}
                        {formatLeagueName(match.competition.name)}
                      </span>
                    </div>
                  </div>
                );
              }

              elements.push(
                <div
                  key={match.id}
                  style={{
                    animation: `matchCardEnter 0.3s ease-out forwards`,
                    animationDelay: `${index * 0.05}s`,
                    opacity: 0,
                  }}>
                  <MatchCard
                    match={match}
                    onClick={() => setSelectedMatch(match)}
                    isFavorite={false}
                    favoriteTeam={favoriteTeam}
                  />
                </div>
              );
            });
            
            return elements;
          })()}
        </div>
      </div>
      <MatchDetails
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}

export default Matches;