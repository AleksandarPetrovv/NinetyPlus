import { useState, useEffect } from 'react'
import { getMatchDetails } from '../services/footballService'
import { formatLeagueName, getStatusColor, getStatusText } from '../utils/matchUtils'
import CloseIcon from '@mui/icons-material/Close'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit'
import { LEAGUE_ICONS } from '../config/leagueIcons'
import api from '../services/api'
import { useAuth } from '../context/AuthContext';
import Login from './Login'
import Register from './Register'
import { toast } from 'react-toastify';
import { ensureAuthenticated } from '../services/authService';
import DeleteIcon from '@mui/icons-material/Delete';
import ReactDOM from 'react-dom';

const formatBulgarianTime = (utcDate) => {
  const date = new Date(utcDate);
  return `${date.toLocaleTimeString('bg-BG', { 
    timeZone: 'Europe/Sofia',
    hour: '2-digit', 
    minute: '2-digit'
  })}`;
}

function MatchDetails({ match, isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth();
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fetchingSource, setFetchingSource] = useState(false)
  const [streamUrl, setStreamUrl] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  }
  
  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  }

  useEffect(() => {
    const fetchDetails = async () => {
      if (!match) return
      setLoading(true)
      try {
        const data = await getMatchDetails(match.id)
        setDetails(data)
        setError(null)
      } catch (err) {
        setError('Failed to load match details')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen && match) {
      fetchDetails()
    } else {
      setStreamUrl(null)
      setIsFullscreen(false)
    }
  }, [isOpen, match])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const handleWatchButtonClick = async (e) => {
    e.preventDefault()
    
    if (!match) return
    
    setFetchingSource(true)
    const targetUrl = 'https://techcabal.net/schedule/soccerstreams/'
    
    try {
      const response = await api.get(`/matches/fetch-source/`, {
        params: { url: targetUrl }
      })
      
      if (response.data && response.data.source) {
        const parser = new DOMParser()
        const doc = parser.parseFromString(response.data.source, 'text/html')
        
        const tables = doc.querySelectorAll('table')
        
        if (tables.length > 0) {
          const homeTeam = match.homeTeam.shortName || match.homeTeam.name
          const awayTeam = match.awayTeam.shortName || match.awayTeam.name
          
          const matchTime = new Date(match.utcDate)
          const adjustedTime = new Date(matchTime)
          adjustedTime.setHours(adjustedTime.getHours() - 1)
          const timeToFind = adjustedTime.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })
          
          let streamId = null
          const rows = tables[0].querySelectorAll('tr')
          
          for (let i = 0; i < rows.length; i++) {
            const row = rows[i]
            const cells = row.querySelectorAll('td')
            
            if (cells.length >= 3) {
              const timeCell = cells[1]
              const matchCell = cells[2]
              const matchLink = matchCell.querySelector('a')
              
              if (timeCell && matchCell && matchLink) {
                const timeCellText = timeCell.textContent.trim()
                const matchCellText = matchCell.textContent.toLowerCase().trim()
                const homeTeamLower = homeTeam.toLowerCase()
                const awayTeamLower = awayTeam.toLowerCase()
                
                if (timeCellText === timeToFind && 
                    matchCellText.includes(homeTeamLower.substring(0, 3)) && 
                    matchCellText.includes(awayTeamLower.substring(0, 3))) {
                  
                  const url = matchLink.getAttribute('href')
                  const matchUrl = url.match(/\/2025\/s(\d+)\//)
                  if (matchUrl && matchUrl[1]) {
                    streamId = matchUrl[1]
                    if (streamId) {
                      setStreamUrl(`https://techcabal.net/clip/s${streamId}.html`)
                    }
                  }
                  break
                }
              }
            }
          }
        }
      }
    } catch (err) {
    } finally {
      setFetchingSource(false)
    }
  }

  useEffect(() => {
    const fetchComments = async () => {
      if (!match) return;
      setLoadingComments(true);
      try {
        const response = await api.get(`/comments/${match.id}/`);
        setComments(response.data);
      } catch (err) {
        console.error('Failed to load comments', err);
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
        content: newComment
      });      
      setComments([response.data, ...comments]);
      setNewComment('');
      toast.success('Comment posted successfully!');
    } catch (err) {
      console.error('Failed to post comment', err);
      
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Authentication required to post comments. Please log in again.');
        setShowLogin(true);
      } else {
        toast.error('Failed to post your comment. Please try again.');
      }
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/delete/${commentId}/`);
      setComments(comments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully!');
    } catch (err) {
      console.error('Failed to delete comment', err);
      toast.error('Failed to delete your comment. Please try again.');
    }
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!match) return null
  
  return (
    ReactDOM.createPortal(
      <>
        <div 
          className="fixed top-0 left-0 right-0 bottom-0 w-full h-full z-50 bg-black/60"
          style={{animation: 'fadeIn 0.3s ease-out forwards'}}
          onClick={onClose}
        />
        <div 
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl"
        >
          <div 
            className={`bg-dark-200 rounded-xl ${isFullscreen ? 'w-screen h-screen fixed inset-0' : ''} p-6 max-h-[90vh] overflow-y-auto border border-dark-300`}
            style={{animation: 'scaleIn 0.3s ease-out forwards'}}
            onClick={(e) => e.stopPropagation()}
          >
            {error ? (
              <div className="text-red-400 text-center py-8">{error}</div>
            ) : (
              <>
                {streamUrl ? (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-purple-400">
                        {match.homeTeam.name} vs {match.awayTeam.name} - Live Stream
                      </h3>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={toggleFullscreen} 
                          className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
                        >
                          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </button>
                        <button 
                          onClick={() => setStreamUrl(null)} 
                          className="text-gray-400 hover:text-white p-1 rounded-full transition-colors"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                    </div>
                    <div className={`overflow-hidden ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'aspect-video'}`}>
                      <iframe 
                        src={streamUrl} 
                        title={`${match.homeTeam.name} vs ${match.awayTeam.name}`}
                        className="w-full h-full border-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-6">
  <div>
    <div className="flex items-center space-x-3 mb-2">
      {match.competition && LEAGUE_ICONS[match.competition.id] ? (
        <img 
          src={LEAGUE_ICONS[match.competition.id]} 
          alt="" 
          className="w-8 h-8 object-contain"
        />
      ) : null}
      <h2 className="text-2xl font-bold text-purple-400">
        {match.competition ? formatLeagueName(match.competition.name) : ''}
      </h2>
    </div>
  </div>
  <button 
    onClick={onClose} 
    className="text-gray-400 hover:text-gray-200 transition-colors"
  >
    <CloseIcon />
  </button>
</div>

                    <div className="space-y-8">
                      <div className="flex justify-center items-center space-x-8 text-center">
                        <div className="flex-1">
                          <img src={match.homeTeam.crest} alt="" className="w-16 h-16 mx-auto mb-2"/>
                          <div className="font-semibold text-gray-200">{match.homeTeam.name}</div>
                        </div>
                        <div className="flex flex-col items-center">
                          <a 
                            href="#"
                            onClick={(e) => {
                              if (match.status === 'IN_PLAY' || match.status === 'PAUSED') {
                                handleWatchButtonClick(e);
                              } else {
                                e.preventDefault();
                                return false;
                              }
                            }}
                            className={`flex items-center px-4 py-2 rounded-lg transition-colors duration-200 text-sm -mt-10 mb-8
                              ${(match.status === 'IN_PLAY' || match.status === 'PAUSED') 
                                ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer' 
                                : match.status === 'FINISHED'
                                ? 'bg-dark-400 text-gray-400 cursor-not-allowed pointer-events-none'
                                : 'bg-dark-300 text-gray-400 cursor-not-allowed pointer-events-none'}`}
                          >
                            <PlayArrowIcon className="w-4 h-4 mr-2" />
                            <span>
                              {fetchingSource ? 'Loading...' :
                                match.status === 'IN_PLAY' || match.status === 'PAUSED'
                                  ? 'Watch Live'
                                  : match.status === 'FINISHED'
                                  ? 'Match has ended'
                                  : `Watch at ${formatBulgarianTime(match.utcDate)}`}
                            </span>
                          </a>
                          <div className={`mb-2 px-3 py-1 text-sm rounded-md ${getStatusColor(match.status)}`}>
                            {getStatusText(match.status, match.utcDate)}
                          </div>
                          <div className="text-4xl font-bold text-purple-400">
                            {match.score?.fullTime?.home ?? 0} - {match.score?.fullTime?.away ?? 0}
                          </div>
                        </div>
                        <div className="flex-1">
                          <img src={match.awayTeam.crest} alt="" className="w-16 h-16 mx-auto mb-2"/>
                          <div className="font-semibold text-gray-200">{match.awayTeam.name}</div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-purple-400 mb-4">Comments</h3>
                  
                  {isAuthenticated && (
                    <form className="mb-6" onSubmit={handleCommentSubmit}>
                      <textarea
                        className="w-full bg-dark-300 text-gray-200 p-3 rounded-lg border border-dark-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Add your comment..."
                        rows="3"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      ></textarea>
                      <button
                        type="submit"
                        className="mt-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 transition-colors text-white rounded-lg font-medium"
                      >
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
                      {comments.map(comment => (
                        <div key={comment.id} className="bg-dark-300 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <span className="font-semibold text-gray-200">{comment.username}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-400 -translate-y-[1px]">
                              <span>{new Date(comment.created_at).toLocaleString()}</span>
                              {user && user.username === comment.username && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="ml-2 p-1 text-red-400 hover:text-red-300 transition-colors rounded-full hover:bg-dark-400"
                                  title="Delete comment"
                                >
                                  <DeleteIcon fontSize="small" />
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="text-gray-300 mt-2">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-400 py-4">No comments yet. Be the first to share your thoughts!</p>
                  )}
                </div>
              </>
            )}
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
      </>,
      document.body
    )
  )
}

export default MatchDetails