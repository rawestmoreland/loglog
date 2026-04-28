const ACHIEVEMENT_ASSET_MAP: Record<string, ReturnType<typeof require>> = {
  adventurer: require('@/assets/achievements/adventurer.svg'),
  'beach bum': require('@/assets/achievements/beach_bum.svg'),
  'century club': require('@/assets/achievements/century_club.svg'),
  'creature of habit': require('@/assets/achievements/creature_of_habit.svg'),
  'cross country': require('@/assets/achievements/cross_country.svg'),
  'early bird': require('@/assets/achievements/early_bird.svg'),
  'globe trotter': require('@/assets/achievements/globe_trotter.svg'),
  'home court advantage': require('@/assets/achievements/home_court_advantage.svg'),
  marathon: require('@/assets/achievements/marathon.svg'),
  'never same twice': require('@/assets/achievements/never_same_twice.svg'),
  'night owl': require('@/assets/achievements/night_owl.svg'),
  'off the grid': require('@/assets/achievements/off_the_grid.svg'),
  'perfect timing': require('@/assets/achievements/perfect_timing.svg'),
  perfection: require('@/assets/achievements/perfection.svg'),
  'road warrior': require('@/assets/achievements/road_warrior.svg'),
  'speed demon': require('@/assets/achievements/speed_demon.svg'),
  'streak master': require('@/assets/achievements/streak_master.svg'),
  'tourist trap': require('@/assets/achievements/tourist_trap.svg'),
  'world tour': require('@/assets/achievements/world_tour.svg'),
};

export function getAchievementAsset(name: string) {
  return ACHIEVEMENT_ASSET_MAP[name.toLowerCase()] ?? null;
}
