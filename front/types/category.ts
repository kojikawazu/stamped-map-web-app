export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
  spotCount: number;
}

export interface CategoriesResponse {
  data: Category[];
}
