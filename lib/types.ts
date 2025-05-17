export interface PooperProfile {
  id?: string;
  profilePictureUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  userUid: string;
  codeName: string;
}

export interface PooProfile {
  id?: string;
  user?: string;
  codeName?: string;
  shift_logs: boolean;
}

export interface PoopSesh {
  id?: string;
  bristol_score?: number;
  user?: string;
  poo_profile?: string;
  is_public: boolean;
  coords?: {
    lat: number;
    lon: number;
  };
  location?: {
    coordinates: {
      lat: number;
      lon: number;
    };
    city?: string;
  };
  company_time: boolean;
  revelations?: string;
  started: Date;
  ended?: Date;
  expand?: {
    user?: {
      id: string;
      codeName: string;
    };
    poo_profile?: {
      id: string;
      codeName: string;
      shift_logs: boolean;
    };
  };
}
