import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../services/api';
import MatchDetails from '../components/MatchDetails';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DeleteIcon from '@mui/icons-material/Delete';
import { toast } from 'react-toastify';

function Profile() {
  const { user, isAuthenticated } = useAuth();
  const [userComments, setUserComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [deletingComment, setDeletingComment] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);
  
  useEffect(() => {
    setAnimateIn(true);
    
    const fetchUserComments = async () => {
      if (!isAuthenticated) return;
      
      try {
        const response = await api.get('/comments/user/');
        setUserComments(response.data);
      } catch (err) {
        setError('Failed to load your comments');
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
      setUserComments(userComments.filter(comment => comment.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (err) {
      toast.error('Failed to delete comment');
      console.error('Failed to delete comment', err);
    } finally {
      setDeletingComment(null);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 animate-pageTransition">
      <div 
        className="bg-dark-200 rounded-xl p-6 mb-8 border border-dark-300"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0)' : 'translateY(-20px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}
      >
        <h1 className="text-3xl font-bold text-purple-400 mb-6">Profile</h1>
        
        <div className="flex items-center mb-8">
          <div 
            className="w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-6"
            style={{
              animation: animateIn ? 'logoBlip 0.5s ease-out forwards' : 'none',
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 
              className="text-2xl font-semibold text-gray-100"
              style={{
                opacity: animateIn ? 1 : 0,
                transform: animateIn ? 'translateX(0)' : 'translateX(20px)',
                transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
              }}
            >
              {user?.username}
            </h2>
          </div>
        </div>
      </div>
      
      <div 
        className="bg-dark-200 rounded-xl p-6 border border-dark-300"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.6s ease 0.3s, transform 0.6s ease 0.3s',
        }}
      >
        <h2 className="text-2xl font-semibold text-purple-400 mb-6">Comments</h2>
        
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
                  transform: animateIn ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.5s ease ${0.4 + index * 0.1}s, transform 0.5s ease ${0.4 + index * 0.1}s`,
                }}
              >
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
                         (comment.match_details?.homeTeam?.name && comment.match_details.homeTeam.name.substring(0, 3).toUpperCase()) || 
                         '?'}
                      </span> 
                      <span className="mx-[6px] text-pink-500 font-medium">vs</span>
                      <span className="text-purple-300 font-bold">
                        {comment.match_details?.awayTeam?.shortName || 
                         (comment.match_details?.awayTeam?.name && comment.match_details.awayTeam.name.substring(0, 3).toUpperCase()) || 
                         '?'}
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
                      title="View match details"
                    >
                      <OpenInNewIcon fontSize="small" />
                    </button>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deletingComment === comment.id}
                      className={`ml-0.5 p-1 -translate-y-[1px] text-red-400 hover:text-red-300 transition-all duration-200 rounded-full hover:bg-dark-400 ${
                        deletingComment === comment.id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      title="Delete comment"
                    >
                      <DeleteIcon fontSize="small" />
                    </button>
                  </div>
                </div>
                <p className="text-gray-300 mt-2">{comment.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <p 
            className="text-center text-gray-400 py-8"
            style={{
              opacity: animateIn ? 1 : 0,
              transition: 'opacity 0.5s ease 0.4s',
            }}
          >
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