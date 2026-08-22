export interface IGovernorate {
  id: number;
  governorate_name_en: string;
  governorate_name_ar: string;
  shippingCost: number;
  extraShippingCost?: number;
}

export interface IDistrict {
  id: number;
  district_name_en: string;
  district_name_ar: string;
}

export interface ICity {
  id: number;
  governorate_id: number;
  city_name_en: string;
  city_name_ar: string;
  districts?: IDistrict[];
}
