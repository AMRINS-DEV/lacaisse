import { getTransactions } from "@/features/transactions/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { TransactionsClient } from "./TransactionsClient";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;

  const now = new Date();
  const month = params.month ? parseInt(params.month) : now.getMonth() + 1;
  const year = params.year ? parseInt(params.year) : now.getFullYear();

  const [transactions, locations] = await Promise.all([
    getTransactions({
      month,
      year,
      from_location_id: params.from_location_id
        ? parseInt(params.from_location_id)
        : undefined,
      to_location_id: params.to_location_id
        ? parseInt(params.to_location_id)
        : undefined,
    }),
    getLocations(),
  ]);

  return (
    <TransactionsClient
      transactions={transactions}
      locations={locations}
      currentMonth={month}
      currentYear={year}
    />
  );
}
