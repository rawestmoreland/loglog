import { AchievementsRecord } from './pocketbase-types';

export class PoopAchievementService {
  private static instance: PoopAchievementService;
  private constructor() {}

  public static getInstance(): PoopAchievementService {
    if (!PoopAchievementService.instance) {
      PoopAchievementService.instance = new PoopAchievementService();
    }
    return PoopAchievementService.instance;
  }

  public async getPoopBadges(): Promise<AchievementsRecord[]> {
    return [];
  }
}
