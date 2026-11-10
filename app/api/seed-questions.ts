
import "dotenv/config";
import { PrismaClient } from "../../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const test = await prisma.test.upsert({
    where: { id: 1 },
    update: {
      title: "Bihar General Knowledge Test",
      description: "A sample test with three questions.",
    },
    create: {
      title: "Bihar General Knowledge Test",
      description: "A sample test with three questions.",
    },
  });

  const questions = [
    {
      questionText: "What is the capital of Bihar?",
      optionA: "Patna",
      optionB: "Gaya",
      optionC: "Bhagalpur",
      optionD: "Muzaffarpur",
      correctAnswer: "A",
    },
    {
      questionText: "Who is known as the Father of the Indian Constitution?",
      optionA: "Mahatma Gandhi",
      optionB: "Dr. B. R. Ambedkar",
      optionC: "Jawaharlal Nehru",
      optionD: "Sardar Patel",
      correctAnswer: "B",
    },
    {
      questionText: "Which planet is known as the Red Planet?",
      optionA: "Venus",
      optionB: "Jupiter",
      optionC: "Mars",
      optionD: "Mercury",
      correctAnswer: "C",
    },
  ];

  for (const question of questions) {
    await prisma.question.upsert({
      where: {
        id: (
          await prisma.question.findFirst({
            where: {
              testId: test.id,
              questionText: question.questionText,
            },
            select: { id: true },
          })
        )?.id ?? -1,
      },
      update: question,
      create: {
        ...question,
        testId: test.id,
      },
    });
  }

  console.log("Test and questions saved successfully!");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
