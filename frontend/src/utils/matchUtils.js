export const formatLeagueName = (competitionName) => {
  if (competitionName === "Primera Division") {
    return "La Liga";
  }
  return competitionName;
};

export const formatMatchDateTime = (utcDate) => {
  const matchDate = new Date(utcDate);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  
  if (matchDate.toDateString() === today.toDateString()) {
    return matchDate.toLocaleTimeString("bg-BG", {
      timeZone: "Europe/Sofia",
      hour: "2-digit",
      minute: "2-digit",
    });
  } else if (matchDate.toDateString() === tomorrow.toDateString()) {
    const time = matchDate.toLocaleTimeString("bg-BG", {
      timeZone: "Europe/Sofia",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `Tomorrow, ${time}`;
  } else {
    const date = matchDate.toLocaleDateString("en-US", {
      timeZone: "Europe/Sofia",
      day: "numeric",
      month: "short",
    });
    const time = matchDate.toLocaleTimeString("bg-BG", {
      timeZone: "Europe/Sofia",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date}, ${time}`;
  }
};

export const getStatusColor = (status) => {
  switch (status) {
    case "IN_PLAY":
      return "bg-live-500 text-white";
    case "PAUSED":
      return "bg-purple-600 text-white";
    case "FINISHED":
      return "bg-dark-400 text-gray-300";
    default:
      return "bg-dark-300 text-gray-400";
  }
};

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
        return "HT";
      }
      if (diffInMinutes >= 60 && diffInMinutes <= 105) {
        return `${diffInMinutes - 15}'`;
      }
      return `90+`;
    }
    case "PAUSED":
      return "HT";
    case "FINISHED":
      return "FT";
    case "TIMED": 
    case "SCHEDULED": {
      return formatMatchDateTime(utcDate);
    }
    default:
      return status;
  }
};