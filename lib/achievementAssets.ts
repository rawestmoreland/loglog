const ACHIEVEMENT_ASSET_MAP: Record<string, ReturnType<typeof require>> = {
  adventurer: require('@/assets/achievements/adventurer.png'),
  'beach bum': require('@/assets/achievements/beach_bum.png'),
  'century club': require('@/assets/achievements/century_club.png'),
  'creature of habit': require('@/assets/achievements/creature_of_habit.png'),
  'cross-country': require('@/assets/achievements/cross_country.png'),
  'early bird': require('@/assets/achievements/early_bird.png'),
  'globe trotter': require('@/assets/achievements/globe_trotter.png'),
  'home court advantage': require('@/assets/achievements/home_court_advantage.png'),
  marathon: require('@/assets/achievements/marathon.png'),
  'never the same twice': require('@/assets/achievements/never_same_twice.png'),
  'night owl': require('@/assets/achievements/night_owl.png'),
  'off the grid': require('@/assets/achievements/off_the_grid.png'),
  'perfect timing': require('@/assets/achievements/perfect_timing.png'),
  perfection: require('@/assets/achievements/perfection.png'),
  'road warrior': require('@/assets/achievements/road_warrior.png'),
  'speed demon': require('@/assets/achievements/speed_demon.png'),
  'streak master': require('@/assets/achievements/streak_master.png'),
  'tourist trap': require('@/assets/achievements/tourist_trap.png'),
  'world tour': require('@/assets/achievements/world_tour.png'),
};

export function getAchievementAsset(name: string) {
  return ACHIEVEMENT_ASSET_MAP[name.toLowerCase()] ?? null;
}
