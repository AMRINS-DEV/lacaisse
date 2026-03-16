export interface PaymentMethod {
  id: number;
  name: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: 1, name: "cash" },
  { id: 2, name: "bank_transfer" },
  { id: 3, name: "card" },
  { id: 4, name: "check" },
  { id: 5, name: "other" },
];

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  return PAYMENT_METHODS;
}
