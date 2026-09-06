import ExpensesManager from "@/components/ExpensesManager";
import { currentMonth } from "@/lib/formatters";
import { isValidMonth } from "@/lib/validation";

export const metadata = { title: "Gastos mensuales | PandaGestion" };

export default async function ExpensesPage({ searchParams }) {
  const params = await searchParams;
  const month = isValidMonth(params?.month) ? params.month : currentMonth();
  return <ExpensesManager initialMonth={month} />;
}
