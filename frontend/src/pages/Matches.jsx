import { useState, useEffect } from "react"
import { getMatches } from "../services/footballService"
import { TOP_LEAGUES } from "../config/leagues"
import MatchDetails from "../components/MatchDetails"
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import { LEAGUE_ICONS } from '../config/leagueIcons'
import { formatLeagueName, getStatusColor, getStatusText } from '../utils/matchUtils'

function MatchCard({ match, onClick }) {
  return (
    <div
      onClick={() => onClick(match)}
      className="bg-dark-200 rounded-xl shadow-md hover:shadow-purple-900/30 hover:bg-dark-300 transition-all duration-200 border border-dark-300">
      <div className="border-b border-dark-400 px-4 py-3">
        <div className="flex items-center space-x-3">
          <img 
            src={LEAGUE_ICONS[match.competition.id]} 
            alt="" 
            className="w-6 h-6 object-contain"
          />
          <span className="text-lg font-bold text-purple-400">
            {formatLeagueName(match.competition.name)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <img src={match.homeTeam.crest} alt="" className="w-12 h-12 object-contain" />
            <span className="text-lg font-medium text-gray-100">
              {match.homeTeam.shortName || match.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-col items-center">
            {match.status !== 'TIMED' && (
              <div className={`absolute -mt-9 px-3 py-1 text-sm rounded-md ${getStatusColor(match.status)}`}>
                {getStatusText(match.status, match.utcDate)}
              </div>
            )}
            <div className="text-3xl font-bold text-purple-400 flex items-center">
              {match.status === 'TIMED' 
                ? getStatusText(match.status, match.utcDate)
                : `${match.score.fullTime.home} - ${match.score.fullTime.away}`}
            </div>
          </div>

          <div className="flex items-center space-x-4 flex-1 justify-end">
            <span className="text-lg font-medium text-gray-100">
              {match.awayTeam.shortName || match.awayTeam.name}
            </span>
            <img src={match.awayTeam.crest} alt="" className="w-12 h-12 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Matches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getMatches();
        if (!data || data.length === 0) {
          setIsRateLimited(true);
        } else {
          setIsRateLimited(false);
          
          const premierLeagueMatches = data.filter(match => 
            match.competition.id === 2021
          );
          
          const laLigaMatches = data.filter(match => 
            match.competition.id === 2014
          );
          
          const otherLeagueMatches = data.filter(match =>
            TOP_LEAGUES.some(league => league.id === match.competition.id) &&
            match.competition.id !== 2021 && 
            match.competition.id !== 2014
          );

          const prioritizedMatches = [
            ...premierLeagueMatches,
            ...laLigaMatches,
            ...otherLeagueMatches
          ].slice(0, 10);

          setMatches(prioritizedMatches);
        }
      } catch (err) {
        if (err.response?.status === 429) {
          setIsRateLimited(true);
        } else {
          setError("Failed to load matches");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid gap-4 mb-8">
        {matches.map((match, index) => (
          <div
            key={match.id}
            style={{ 
              animation: `matchCardEnter 0.3s ease-out forwards`,
              animationDelay: `${index * 0.05}s`,
              opacity: 0
            }}
          >
            <MatchCard
              match={match}
              onClick={() => setSelectedMatch(match)}
            />
          </div>
        ))}
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
