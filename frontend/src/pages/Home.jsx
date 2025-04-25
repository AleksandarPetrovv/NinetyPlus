import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMatches } from '../services/footballService';
import { formatLeagueName, getStatusColor, getStatusText } from '../utils/matchUtils';
import { LEAGUE_ICONS } from '../config/leagueIcons';
import SportsIcon from '@mui/icons-material/Sports';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ChatIcon from '@mui/icons-material/Chat';
import { useAuth } from '../context/AuthContext';
import Login from '../components/Login';
import Register from '../components/Register';
import MatchDetails from '../components/MatchDetails';

function Home() {
  const [featuredMatches, setFeaturedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setAnimateIn(true);

    const fetchMatches = async () => {
      try {
        const allMatches = await getMatches();
        
        const liveMatches = allMatches.filter(match => 
          match.status === 'IN_PLAY' || match.status === 'PAUSED'
        );
        
        const upcomingMatches = allMatches.filter(match => 
          match.status === 'TIMED' && new Date(match.utcDate) - new Date() < 24 * 60 * 60 * 1000
        );
        
        const featured = [...liveMatches, ...upcomingMatches].slice(0, 3);
        setFeaturedMatches(featured);
      } catch (error) {
        console.error('Failed to fetch matches', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, []);

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };
  
  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  return (
    <div className="max-w-4xl mx-auto animate-pageTransition">
      <div 
        className="mb-12 text-center" 
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
          NinetyPlus
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Real-time football scores, stats, and fan discussions in one place
        </p>
        
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/matches')}
            className="px-6 py-3 bg-purple-600 text-white font-medium rounded-lg transition-colors hover:bg-purple-700 mr-4"
          >
            Live Matches
          </button>
          {!isAuthenticated && (
            <button 
              onClick={() => setShowRegister(true)}
              className="px-6 py-3 bg-dark-300 text-white font-medium rounded-lg transition-colors hover:bg-dark-400"
            >
              Join the Community
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="mb-12"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateX(0)' : 'translateX(-20px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
        }}
      >
        <h2 className="text-2xl font-bold text-purple-400 mb-6">Featured Matches</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : featuredMatches.length > 0 ? (
          <div className="grid gap-4">
            {featuredMatches.map((match, index) => (
              <div 
                key={match.id} 
                className="bg-dark-200 rounded-xl p-4 border border-dark-300 cursor-pointer hover:bg-dark-300 transition-colors"
                onClick={() => setSelectedMatch(match)}
                style={{
                  opacity: animateIn ? 1 : 0,
                  transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${0.3 + index * 0.1}s, transform 0.5s ease ${0.3 + index * 0.1}s`,
                }}
              >
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
            ))}
            
            <div 
              className="text-center mt-4"
              style={{
                opacity: animateIn ? 1 : 0,
                transition: `opacity 0.5s ease ${0.6}s`,
              }}
            >
              <Link 
                to="/matches" 
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                View all matches →
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No featured matches available right now.
            <br />
            <Link 
              to="/matches" 
              className="text-purple-400 hover:text-purple-300 transition-colors"
            >
              View all matches
            </Link>
          </div>
        )}
      </div>
      
      <div 
        className="mb-12"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateX(0)' : 'translateX(20px)',
          transition: 'opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s',
        }}
      >
        <h2 className="text-2xl font-bold text-purple-400 mb-6">Why NinetyPlus?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <SportsIcon className="text-purple-400" />,
              title: "Live Updates",
              description: "Real-time match updates, scores, and statistics for all your favorite leagues"
            },
            {
              icon: <AnalyticsIcon className="text-purple-400" />,
              title: "League Tables",
              description: "Stay updated with the latest standings and team performance metrics"
            },
            {
              icon: <ChatIcon className="text-purple-400" />,
              title: "Fan Community",
              description: "Join the conversation with other fans through match-specific comments"
            }
          ].map((feature, index) => (
            <div 
              className="bg-dark-200 rounded-xl p-6 border border-dark-300"
              key={index}
              style={{
                opacity: animateIn ? 1 : 0,
                transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
                transition: `opacity 0.5s ease ${0.6 + index * 0.1}s, transform 0.5s ease ${0.6 + index * 0.1}s`,
              }}
            >
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center">
                  {feature.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold text-purple-400 text-center mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-300 text-center">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {!isAuthenticated && (
        <div 
          className="bg-gradient-to-r from-purple-900/40 to-purple-600/40 rounded-xl p-8 border border-purple-800 mb-12"
          style={{
            opacity: animateIn ? 1 : 0,
            transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.8s ease 0.7s, transform 0.8s ease 0.7s',
          }}
        >
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Join the NinetyPlus Community
            </h2>
            <p className="text-gray-200 mb-6">
              Create an account to comment on matches and join the conversation with other football fans.
            </p>
            <button 
              onClick={() => setShowRegister(true)}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Register Now
            </button>
            <p className="mt-4 text-gray-300">
              Already have an account? {' '}
              <button 
                onClick={() => setShowLogin(true)}
                className="text-purple-300 hover:text-purple-200 transition-colors"
              >
                Log in here
              </button>
            </p>
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

export default Home;