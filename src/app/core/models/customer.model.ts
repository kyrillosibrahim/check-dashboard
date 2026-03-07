export interface ICustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  addresses?: { fullName: string; phone: string; governorate: string; city: string; address: string }[];
  createdAt: string;
}
