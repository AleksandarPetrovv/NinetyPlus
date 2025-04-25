export const formatLeagueName = (competitionName) => {
  if (competitionName === 'Primera Division') {
    return 'La Liga'
  }
  return competitionName
}

export const getStatusColor = (status) => {
  switch(status) {
    case 'IN_PLAY':
      return 'bg-live-500 text-white'
    case 'PAUSED':
      return 'bg-purple-400 text-white'
    case 'FINISHED':
      return 'bg-dark-400 text-white'
    case 'TIMED':
      return 'bg-dark-300 text-gray-200'
    default:
      return 'bg-dark-300 text-gray-200'
  }
}

export const getStatusText = (status, utcDate) => {
  switch (status) {
    case "IN_PLAY": {
      const kickoff = new Date(utcDate);
      const now = new Date();
      const diffInMinutes = Math.floor((now - kickoff) / (1000 * 60));
      
      if (diffInMinutes <= 45) {
        return `${diffInMinutes}'`;
      }
      if (diffInMinutes > 45 && diffInMinutes < 60) {
        return 'HT';
      }
      if (diffInMinutes >= 60 && diffInMinutes <= 105) {
        return `${(diffInMinutes - 15)}'`;
      }
      return `90+`;
    }
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "FT";
    case "TIMED": {
      const date = new Date(utcDate);
      return date.toLocaleTimeString("bg-BG", {
        timeZone: "Europe/Sofia",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    default:
      return status;
  }
}