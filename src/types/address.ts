// src/types/address.ts
export type PackType = "packstation" | "postfiliale";

export type Address = {
  id: string;
  firstName: string;
  lastName: string;
  street: string;
  house: string;
  zip: string;
  city: string;
  phone?: string;
  note?: string;
  packType?: "" | PackType;
  postNummer?: string;
  stationNr?: string;
  isDefault?: boolean;
};
