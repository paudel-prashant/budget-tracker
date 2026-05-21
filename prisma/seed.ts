import { PrismaClient, TransactionType } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

async function main() {
  await prisma.transaction.deleteMany();

  await prisma.transaction.createMany({
    data: [
      {
        title: "Monthly Salary",
        amount: 4200,
        type: TransactionType.INCOME,
        category: "Salary",
        date: daysAgo(2),
      },
      {
        title: "Freelance Project",
        amount: 850,
        type: TransactionType.INCOME,
        category: "Freelance",
        date: daysAgo(8),
      },
      {
        title: "Grocery Shopping",
        amount: 124.5,
        type: TransactionType.EXPENSE,
        category: "Food",
        date: daysAgo(1),
      },
      {
        title: "Electric Bill",
        amount: 89.25,
        type: TransactionType.EXPENSE,
        category: "Utilities",
        date: daysAgo(5),
      },
      {
        title: "Netflix Subscription",
        amount: 15.99,
        type: TransactionType.EXPENSE,
        category: "Entertainment",
        date: daysAgo(12),
      },
      {
        title: "Gas",
        amount: 52.3,
        type: TransactionType.EXPENSE,
        category: "Transport",
        date: daysAgo(3),
      },
    ],
  });

  console.log("Seeded sample transactions");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
