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
  started: Date | string;
  ended?: Date;
  place_id?: string | null;
  place?: {
    id: string;
    name: string;
    location: {
      lon: number;
      lat: number;
    };
    place_type: string;
    rating?: number;
  };
  custom_place_name?: string | null;
  place_type?: string;
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

export interface PoopComment {
  id: string;
  sesh: string;
  user: string;
  content: string;
  created: string;
  expand?: {
    user?: {
      id: string;
      codeName: string;
      username?: string;
      name?: string;
    };
  };
}
