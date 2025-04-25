export const LEAGUES = {
  PREMIER_LEAGUE: { id: 2021, name: 'Premier League', country: 'England' },
  LA_LIGA: { id: 2014, name: 'La Liga', country: 'Spain' },
  BUNDESLIGA: { id: 2002, name: 'Bundesliga', country: 'Germany' },
  SERIE_A: { id: 2019, name: 'Serie A', country: 'Italy' },
  LIGUE_1: { id: 2015, name: 'Ligue 1', country: 'France' },
  CHAMPIONS_LEAGUE: { id: 2001, name: 'UEFA Champions League', country: 'Europe' },
  EUROPA_LEAGUE: { id: 2146, name: 'UEFA Europa League', country: 'Europe' }
}

export const TOP_LEAGUES = [
  LEAGUES.CHAMPIONS_LEAGUE,
  LEAGUES.EUROPA_LEAGUE,
  LEAGUES.PREMIER_LEAGUE,
  LEAGUES.LA_LIGA,
  LEAGUES.BUNDESLIGA,
  LEAGUES.SERIE_A,
  LEAGUES.LIGUE_1
]

export const DOMESTIC_LEAGUES = [
  LEAGUES.PREMIER_LEAGUE,
  LEAGUES.LA_LIGA,
  LEAGUES.BUNDESLIGA,
  LEAGUES.SERIE_A,
  LEAGUES.LIGUE_1
]