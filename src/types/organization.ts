export type Tier = "free" | "pro" | "enterprise";

export type ColorPalette = {
  primary: string;
  accent: string;
  background: string;
};

export type Organization = {
  id: string;
  name: string;
  tierId: string;
  tierName: Tier;
  colorPalette?: ColorPalette;
  createdAt: string;
};

export type OrganizationCreateInput = {
  name: string;
  colorPalette?: ColorPalette;
};

export type OrganizationUpdateInput = {
  name?: string;
  colorPalette?: ColorPalette;
};

