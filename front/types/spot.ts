export interface SpotCategory {
  id: string;
  name: string;
  color: string;
}

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory;
  latitude: number;
  longitude: number;
  visitedAt: string;
  memo: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SpotsResponse {
  data: Spot[];
  pagination: Pagination;
}
