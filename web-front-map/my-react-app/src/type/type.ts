export type SideBarType = {
  title: string;
  state: boolean;
};
export type Gps = {
  lat: number;
  lng: number;
};

export type SearchResult = {
  title: string;
  distance: number;
  position: Gps;
};

export type RouteSearch = {
  apikey: string;
};
export type FireGps = {
  _lat: number;
  _long: number;
};
export type ShoptextData = {
  id: number;
  shop_name: string;
  position: FireGps;
};
export type ShopInfo = {
  ShoptextData: ShoptextData;
  img?: string[];
};
