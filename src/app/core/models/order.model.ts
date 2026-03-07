export interface IOrderItem {
  productId: string;
  title: string;
  titleAr?: string;
  image?: string;
  merchant?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IOrderCustomer {
  name: string;
  phone: string;
  email?: string;
}

export interface IShippingAddress {
  fullName: string;
  phone: string;
  governorate: string;
  city: string;
  district?: string;
  address: string;
}

export interface IOrder {
  id: string;
  customer: IOrderCustomer;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  shippingCost: number;
  shippingCompany: string;
  subtotal: number;
  discount: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  paymentStatus: string;
  notes: string;
  date: string;
  storeProfitTotal: number;
  systemCommission: number;
}
