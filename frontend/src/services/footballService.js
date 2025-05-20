import axios from "axios";
import { TOP_LEAGUES } from "../config/leagues";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const CACHE_TIME = 180000;
let matchesCache = { data: null, timestamp: 0 };

export const getMatches = async () => {
  const now = Date.now();
  if (matchesCache.data && now - matchesCache.timestamp < CACHE_TIME) {
    return matchesCache.data.filter(
      (match) =>
        TOP_LEAGUES.some((league) => league.id === match.competition.id) &&
        match.status !== "POSTPONED"
    );
  }

  try {
    const response = await api.get("/matches/live/");
    matchesCache = {
      data: response.data.matches,
      timestamp: now,
    };
    return matchesCache.data.filter(
      (match) =>
        TOP_LEAGUES.some((league) => league.id === match.competition.id) &&
        match.status !== "POSTPONED"
    );
  } catch (error) {
    return [];
  }
};

export const getStandings = async (leagueId = 2021) => {
  try {
    const response = await api.get(`/matches/standings/${leagueId}/`);
    return response.data.standings[0].table;
  } catch (error) {
    return [];
  }
};

export const getMatchDetails = async (matchId) => {
  try {
    const response = await api.get(`/matches/match/${matchId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const formatBulgarianTime = (utcDate) => {
  const date = new Date(utcDate);
  return date.toLocaleTimeString("bg-BG", {
    timeZone: "Europe/Sofia",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getMatchEvents = async (matchId) => {
  try {
    const response = await api.get(`/matches/match-events/${matchId}/`);
    return response.data;
  } catch (error) {
    throw error;
  }
};