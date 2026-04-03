export interface Marker {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  categoryColor: string;
}

export interface MarkersResponse {
  data: Marker[];
}
