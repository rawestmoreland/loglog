export interface PooperProfile {
  id?: string;
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userUid: string;
  codeName: string;
}

export interface PoopSesh {
  id?: string;
  user?: string;
  is_public: boolean;
  location?: {
    coordinates: {
      lat: number;
      lon: number;
    };
  };
  revelations?: string;
  started: Date;
  ended?: Date;
  expand?: {
    user?: {
      id: string;
      codeName: string;
    };
  };
}
