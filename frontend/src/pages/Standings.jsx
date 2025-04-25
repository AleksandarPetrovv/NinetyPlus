import { useState, useEffect } from 'react'
import { getStandings } from '../services/footballService'
import { DOMESTIC_LEAGUES } from '../config/leagues'
import { LEAGUE_ICONS } from '../config/leagueIcons'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'

function RateLimitMessage() {
  return (
    <div className="p-8 text-center bg-yellow-50 rounded-xl border border-yellow-200">
      <AccessTimeIcon className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">API Rate Limit Reached</h3>
      <p className="text-yellow-600">Please wait 60 seconds. The API rate limit is 10 calls / minute.</p>
    </div>
  )
}

function Standings() {
  const [standings, setStandings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [selectedLeague, setSelectedLeague] = useState(DOMESTIC_LEAGUES[0])

  useEffect(() => {
    const fetchStandings = async () => {
      setLoading(true)
      try {
        const data = await getStandings(selectedLeague.id)
        if (!data || data.length === 0) {
          setIsRateLimited(true)
        } else {
          setIsRateLimited(false)
          setStandings(data)
          setError(null)
        }
      } catch (err) {
        if (err.response?.status === 429) {
          setIsRateLimited(true)
        } else {
          setError('Failed to load standings')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchStandings()
  }, [selectedLeague])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
    </div>
  )

  if (isRateLimited) return <RateLimitMessage />

  if (error) return (
    <div className="flex justify-center items-center min-h-[60vh] text-red-500 text-center">
      <div>
        <ErrorOutlineIcon className="w-12 h-12 mx-auto mb-4" />
        <p>{error}</p>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src={LEAGUE_ICONS[selectedLeague.id]} 
            alt="" 
            className="w-12 h-12 object-contain"
          />
          <h1 className="text-4xl font-bold text-purple-400">
            {selectedLeague.name}
          </h1>
        </div>
        <select 
          value={selectedLeague.id}
          onChange={(e) => {
            const league = DOMESTIC_LEAGUES.find(l => l.id === Number(e.target.value))
            setSelectedLeague(league)
          }}
          className="px-4 py-2 rounded-lg bg-dark-300 border border-dark-400 text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          {DOMESTIC_LEAGUES.map(league => (
            <option key={league.id} value={league.id}>
              {league.name} ({league.country})
            </option>
          ))}
        </select>
      </div>

      <div className="bg-dark-200 rounded-xl shadow-lg overflow-hidden border border-dark-300">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-dark-300 text-gray-200">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider w-16">#</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Team</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">P</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">W</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">D</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">L</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">GF</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">GA</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">GD</th>
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider w-16">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-300">
              {standings.map((team) => (
                <tr key={team.position} 
                    className={`hover:bg-dark-300 transition-colors duration-150
                      ${team.position <= 4 ? 'bg-dark-400/50' : 
                        team.position >= 18 ? 'bg-dark-400/30' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-semibold
                      ${team.position === 1 ? 'bg-success-500 text-white' :
                        team.position <= 4 ? 'bg-purple-600 text-white' : 
                        team.position >= 18 ? 'bg-live-500 text-white' : 
                        'bg-dark-400 text-gray-200'}`}>
                      {team.position}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {team.team.crest && (
                        <img src={team.team.crest} alt="" className="w-6 h-6 mr-3 object-contain"/>
                      )}
                      <span className="font-medium text-gray-200">{team.team.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.playedGames}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.won}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.draw}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.lost}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.goalsFor}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.goalsAgainst}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{team.goalDifference}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-center text-purple-400">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Standings