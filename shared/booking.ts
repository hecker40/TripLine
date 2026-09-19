export interface StayOffer {
  id: string;
  name: string;
  url: string;
  totalPrice: number | null;
  currency: string | null;
}
export interface StaySearch {
  provider: "Booking.com MCP";
  checkedAt: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  country: string;
  offers: StayOffer[];
  message: string;
}
