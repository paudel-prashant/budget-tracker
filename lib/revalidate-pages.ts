import { revalidatePath } from "next/cache";

/** Invalidate server-rendered pages that depend on transactions, budgets, or recurring data. */
export function revalidateFinancePages() {
  revalidatePath("/");
  revalidatePath("/insights");
  revalidatePath("/budget");
}
