
"use client";

import { useState } from "react";

const questions = [
  {
    question: "What is the capital of Bihar?",
    options: ["Patna", "Gaya", "Muzaffarpur", "Bhagalpur"],
    correctAnswer: 0,
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
  },
];

export default function Home() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const score = questions.reduce(
    (total, question, index) =>
      total + (answers[index] === question.correctAnswer ? 1 : 0),
    0
  );

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="mb-2 text-3xl font-bold">
        State SSC / PCS Mock Test
      </h1>

      <p className="mb-6 text-gray-600">
        General Knowledge | 2 Questions | Practice Test
      </p>

      {questions.map((question, index) => (
        <section
          key={index}
          className="mb-6 rounded-lg border p-5"
        >
          <h2 className="mb-4 text-lg font-semibold">
            {index + 1}. {question.question}
          </h2>

          {question.options.map((option, optionIndex) => (
            <label
              key={optionIndex}
              className="mb-3 flex cursor-pointer items-center gap-3"
            >
              <input
                type="radio"
                name={`question-${index}`}
                checked={answers[index] === optionIndex}
                disabled={submitted}
                onChange={() => {
                  setAnswers((previous) => {
                    const updated = [...previous];
                    updated[index] = optionIndex;
                    return updated;
                  });
                }}
              />
              {option}
            </label>
          ))}
        </section>
      ))}

      {!submitted ? (
        <button
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
          onClick={() => setSubmitted(true)}
        >
          Submit Test
        </button>
      ) : (
        <section className="rounded-lg border p-5">
          <h2 className="text-xl font-bold">Test Result</h2>
          <p className="mt-2">
            Your score: {score} / {questions.length}
          </p>
          <button
            className="mt-4 rounded-lg bg-gray-800 px-5 py-2 text-white"
            onClick={() => {
              setAnswers([]);
              setSubmitted(false);
            }}
          >
            Try Again
          </button>
        </section>
      )}
    </main>
  );
}
