
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Test = {
  id: number;
  title: string;
};

export default function AddQuestionPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [testId, setTestId] = useState("");
  const [subject, setSubject] = useState("");
const [topic, setTopic] = useState("");
const [questionText, setQuestionText] = useState("");
const [optionA, setOptionA] = useState("");
const [optionB, setOptionB] = useState("");
const [optionC, setOptionC] = useState("");
const [optionD, setOptionD] = useState("");

const [questionTextHi, setQuestionTextHi] = useState("");
const [optionAHi, setOptionAHi] = useState("");
const [optionBHi, setOptionBHi] = useState("");
const [optionCHi, setOptionCHi] = useState("");
const [optionDHi, setOptionDHi] = useState("");
const [explanationHi, setExplanationHi] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("A");
  const [explanation, setExplanation] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [csvQuestions, setCsvQuestions] = useState<any[]>([]);
const [csvMessage, setCsvMessage] = useState("");
const [csvLoading, setCsvLoading] = useState(false);

function downloadCSVTemplate() {
  const csv = [
  "subject,topic,questionText,optionA,optionB,optionC,optionD,correctAnswer,explanation,questionTextHi,optionAHi,optionBHi,optionCHi,optionDHi,explanationHi",
    '"History","Indian Constitution","What is the capital of Bihar?","Patna","Gaya","Delhi","Ranchi","A","Patna is the capital of Bihar.","बिहार की राजधानी क्या है?","पटना","गया","दिल्ली","रांची","पटना बिहार की राजधानी है।"',
].join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "questions-template.csv";
  link.click();

  URL.revokeObjectURL(url);
}

function parseCSVLine(line: string) {
  const result: string[] = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        value += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === "," && !insideQuotes) {
      result.push(value.trim());
      value = "";
    } else {
      value += char;
    }
  }

  result.push(value.trim());
  return result;
}

async function handleCSVFile(file: File) {
  setCsvMessage("");

  if (!file.name.toLowerCase().endsWith(".csv")) {
    setCsvMessage("Please select a CSV file.");
    return;
  }

  const text = (await file.text()).replace(/^\uFEFF/, "");
  const lines = text.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length < 2) {
    setCsvMessage("CSV file has no questions.");
    return;
  }

  const headers = parseCSVLine(lines[0]).map((h) =>
    h.trim().toLowerCase()
  );

const requiredHeaders = [
  "questiontext",
  "optiona",
  "optionb",
  "optionc",
  "optiond",
  "correctanswer",
  "explanation",
];

const hindiHeaders = [
  "questiontexthi",
  "optionathi",
  "optionbhi",
  "optionchi",
  "optiondhi",
  "explanationhi",
];

if (!requiredHeaders.every((header) => headers.includes(header))) {
  setCsvMessage("CSV headers are incorrect. Download our template.");
  return;
}

const parsed = [];

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);

  const get = (header: string) => {
    const index = headers.indexOf(header);
    return index >= 0 ? values[index] || "" : "";
  };

  parsed.push({
    subject: get("subject"),
topic: get("topic"),
    questionText: get("questiontext"),
    optionA: get("optiona"),
    optionB: get("optionb"),
    optionC: get("optionc"),
    optionD: get("optiond"),
    correctAnswer: get("correctanswer").toUpperCase(),
    explanation: get("explanation"),

    questionTextHi: get("questiontexthi"),
   optionAHi: get("optionahi"),
    optionBHi: get("optionbhi"),
    optionCHi: get("optionchi"),
    optionDHi: get("optiondhi"),
    explanationHi: get("explanationhi"),
  });
}
  setCsvQuestions(parsed);
  setCsvMessage(`${parsed.length} questions ready for preview.`);
}


async function uploadCSVQuestions() {
  if (!testId) {
    setCsvMessage("Please select a mock test first.");
    return;
  }

  if (csvQuestions.length === 0) {
    setCsvMessage("Please select a CSV file first.");
    return;
  }

  setCsvLoading(true);
  setCsvMessage("Uploading questions...");

  try {
    const response = await fetch("/api/admin/questions/bulk", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        testId: Number(testId),
        subject,
topic,
        questions: csvQuestions,
      }),
    });

    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
      router.replace("/admin-login");
      return;
    }

    if (!response.ok) {
      setCsvMessage(data.error || "Upload failed.");
      return;
    }

    setCsvMessage(`${data.savedCount} questions uploaded successfully!`);
    setCsvQuestions([]);
  } catch {
    setCsvMessage("Unable to connect to the server.");
  } finally {
    setCsvLoading(false);
  }
}
  useEffect(() => {
    async function loadTests() {
      try {
        const response = await fetch("/api/admin/manage-tests", {
          cache: "no-store",
        });

       const data = await response.json();

if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

if (response.ok) {
          const testList = Array.isArray(data)
            ? data
            : data.tests || [];

          setTests(testList);
        } else {
          setMessage("Unable to load mock tests.");
        }
      } catch {
        setMessage("Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    }

    loadTests();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("Saving question...");

    try {
      const response = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
body: JSON.stringify({
  testId: Number(testId),

  questionText,
  optionA,
  optionB,
  optionC,
  optionD,

  questionTextHi,
  optionAHi,
  optionBHi,
  optionCHi,
  optionDHi,

  correctAnswer,
  explanation,
  explanationHi,
}),
      });

      const data = await response.json();

if (response.status === 401 || response.status === 403) {
  router.replace("/admin-login");
  return;
}

if (!response.ok) {
        setMessage(data.error || "Unable to save question.");
        return;
      }

      setMessage("Question added successfully!");

      setQuestionText("");
      setOptionA("");
      setOptionB("");
      setOptionC("");
      setOptionD("");
      setCorrectAnswer("A");
      setExplanation("");
    } catch {
      setMessage("Something went wrong. Please try again.");
    }
  }

  return (
    <main style={styles.container}>
      <h1>Add Questions</h1>
      
<div style={{ marginTop: "25px", marginBottom: "30px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
  <h2>Bulk Upload Questions (CSV)</h2>
  <div style={{ marginBottom: "15px" }}>
  <label style={{ display: "block", marginBottom: "8px" }}>
    Select Mock Test for CSV Upload
  </label>

  <select
    value={testId}
    onChange={(e) => setTestId(e.target.value)}
    style={styles.input}
  >
    <option value="">Select a Mock Test</option>

    {tests.map((test) => (
      <option key={test.id} value={test.id}>
        {test.title}
      </option>
    ))}
  </select>
</div>

  <p>
    Download the template, fill in your questions using Excel,
    save as CSV, and upload the file.
  </p>

  <button
    type="button"
    style={styles.button}
    onClick={downloadCSVTemplate}
  >
    Download CSV Template
  </button>

  <div style={{ marginTop: "15px" }}>
    <label>Select CSV File</label>
    <input
      type="file"
      accept=".csv,text/csv"
      style={styles.input}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleCSVFile(file);
      }}
    />
  </div>

  {csvMessage && <p>{csvMessage}</p>}

{csvQuestions.length > 0 && (
  <>
    <h3>Preview: {csvQuestions.length} Questions</h3>

    {csvQuestions.slice(0, 5).map((q, index) => (
      <div
        key={index}
        style={{
          padding: "15px",
          marginBottom: "12px",
          background: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h4>Question {index + 1}</h4>

        <p><strong>English:</strong> {q.questionText}</p>
        <p>A. {q.optionA}</p>
        <p>B. {q.optionB}</p>
        <p>C. {q.optionC}</p>
        <p>D. {q.optionD}</p>

        <hr />

        <p><strong>हिंदी:</strong> {q.questionTextHi || "Not provided"}</p>
        <p>A. {q.optionAHi || "Not provided"}</p>
        <p>B. {q.optionBHi || "Not provided"}</p>
        <p>C. {q.optionCHi || "Not provided"}</p>
        <p>D. {q.optionDHi || "Not provided"}</p>

        <hr />

        <p><strong>Correct Answer:</strong> {q.correctAnswer}</p>
        <p><strong>English Explanation:</strong> {q.explanation || "Not provided"}</p>
        <p><strong>Hindi Explanation:</strong> {q.explanationHi || "Not provided"}</p>
      </div>
    ))}

    {csvQuestions.length > 5 && (
      <p>Showing first 5 questions only.</p>
    )}

    <button
      type="button"
      style={styles.button}
      onClick={uploadCSVQuestions}
      disabled={csvLoading}
    >
      {csvLoading ? "Uploading..." : "Upload All Questions"}
    </button>
  </>
)}
    <>
      <h3>Preview: {csvQuestions.length} Questions</h3>

      {csvQuestions.slice(0, 5).map((q, index) => (
        <div
          key={index}
          style={{
            padding: "12px",
            marginBottom: "10px",
            background: "#f3f4f6",
            borderRadius: "6px",
          }}
        >
          <strong>{index + 1}. {q.questionText}</strong>
          <p>A. {q.optionA}</p>
          <p>B. {q.optionB}</p>
          <p>C. {q.optionC}</p>
          <p>D. {q.optionD}</p>
          <p>Correct Answer: {q.correctAnswer}</p>
        </div>
      ))}

      {csvQuestions.length > 5 && (
        <p>Showing first 5 questions only.</p>
      )}

<button
  type="button"
  style={styles.button}
  onClick={uploadCSVQuestions}
  disabled={csvLoading}
>
  {csvLoading ? "Uploading..." : "Upload All Questions"}
</button>
    </>
</div>


      <p>Enter questions and options in Hindi or English.</p>

      {loading ? (
        <p>Loading mock tests...</p>
      ) : tests.length === 0 ? (
        <p>No mock tests found. Create a test first.</p>
      ) : (
        <form onSubmit={handleSubmit} style={styles.form}>
          <label>Select Mock Test</label>

          <select
            style={styles.input}
            value={testId}
            onChange={(e) => setTestId(e.target.value)}
            required
          >
            <option value="">Choose a test</option>
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.title}
              </option>
            ))}
          </select>

          <label>Question / प्रश्न</label>
          <label>Subject / विषय</label>
<select
  value={subject}
  onChange={(e) => setSubject(e.target.value)}
  style={styles.input}
>
  <option value="">Select Subject</option>
  <option value="History">History</option>
  <option value="Geography">Geography</option>
  <option value="Polity">Polity</option>
  <option value="General Knowledge">General Knowledge</option>
  <option value="General Science">General Science</option>
  <option value="Mathematics">Mathematics</option>
  <option value="Reasoning">Reasoning</option>
  <option value="Economics">Economics</option>
  <option value="Current Affairs">Current Affairs</option>
</select>

<label>Topic / टॉपिक</label>
<input
  value={topic}
  onChange={(e) => setTopic(e.target.value)}
  placeholder="Example: Indian Constitution"
  style={styles.input}
/>
        
<textarea
  value={questionText}
  onChange={(e) => setQuestionText(e.target.value)}
  rows={3}
  placeholder="Enter question in English"
  style={styles.input}
  required
/>
<label>Question in Hindi / हिंदी में प्रश्न</label>
<textarea
  value={questionTextHi}
  onChange={(e) => setQuestionTextHi(e.target.value)}
  rows={3}
  placeholder="यहाँ हिंदी में प्रश्न लिखें"
  style={styles.input}
/>

          <label>Option A</label>
          <input
            value={optionA}
            onChange={(e) => setOptionA(e.target.value)}
            placeholder="Option A"
            style={styles.input}
            required
          />
          <label>Option A in Hindi / विकल्प A हिंदी में</label>
<input
  value={optionAHi}
  onChange={(e) => setOptionAHi(e.target.value)}
  placeholder="हिंदी में विकल्प A"
  style={styles.input}
/>

          <label>Option B</label>
          <input
            value={optionB}
            onChange={(e) => setOptionB(e.target.value)}
            placeholder="Option B"
            style={styles.input}
            required
          />
          <label>Option B in Hindi</label>
<input
  value={optionBHi}
  onChange={(e) => setOptionBHi(e.target.value)}
  placeholder="हिंदी में विकल्प B"
  style={styles.input}
/>

          <label>Option C</label>
          <input
            value={optionC}
            onChange={(e) => setOptionC(e.target.value)}
            placeholder="Option C"
            style={styles.input}
            required
          />
          <label>Option C in Hindi</label>
<input
  value={optionCHi}
  onChange={(e) => setOptionCHi(e.target.value)}
  placeholder="हिंदी में विकल्प C"
  style={styles.input}
/>

          <label>Option D</label>
          <input
            value={optionD}
            onChange={(e) => setOptionD(e.target.value)}
            placeholder="Option D"
            style={styles.input}
            required
          />
          <label>Option D in Hindi</label>
<input
  value={optionDHi}
  onChange={(e) => setOptionDHi(e.target.value)}
  placeholder="हिंदी में विकल्प D"
  style={styles.input}
/>

          <label>Correct Answer</label>
          <select
            style={styles.input}
            value={correctAnswer}
            onChange={(e) => setCorrectAnswer(e.target.value)}
          >
            <option value="A">Option A</option>
            <option value="B">Option B</option>
            <option value="C">Option C</option>
            <option value="D">Option D</option>
          </select>

          <label>Explanation / व्याख्या (Optional)</label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={3}
            placeholder="Enter explanation in Hindi or English"
            style={styles.input}
          />
          <label>Explanation in Hindi / हिंदी में व्याख्या</label>
<textarea
  value={explanationHi}
  onChange={(e) => setExplanationHi(e.target.value)}
  rows={3}
  placeholder="यहाँ हिंदी में व्याख्या लिखें"
  style={styles.input}
/>


          <button style={styles.button} type="submit">
            Save Question
          </button>

          {message && <p>{message}</p>}
        </form>
      )}

      <a href="/admin-dashboard">← Back to Dashboard</a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: "700px",
    margin: "40px auto",
    padding: "25px",
    fontFamily: "Arial, sans-serif",
    color: "#172033",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "25px",
    marginBottom: "25px",
  },
  input: {
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "16px",
    width: "100%",
    boxSizing: "border-box",
  },
  button: {
    padding: "14px",
    background: "#174ea6",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
    csvSection: {
    marginTop: "30px",
    marginBottom: "35px",
    padding: "20px",
    border: "2px solid #174ea6",
    borderRadius: "10px",
    background: "#f5f8ff",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  preview: {
    padding: "15px",
    marginTop: "10px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    background: "white",
  },
};
