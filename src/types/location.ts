// src/types/location.ts
export type PickupLocation = {
  id: string;
  name: string;
  type: string;
  street: string;
  houseNo?: string;
  zip: string;
  city: string;
  lat?: number;
  lng?: number;
  distance?: number;
  packstationNumber?: string | number;
  openingHours?: any;
};
