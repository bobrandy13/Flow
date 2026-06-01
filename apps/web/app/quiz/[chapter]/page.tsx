"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { QUIZZES_BY_SLUG } from "@flow/shared/quizzes";
import type { ChapterQuiz, QuizQuestion } from "@flow/shared/types/quiz";
import { color, fontFamily } from "@/lib/ui/theme";

const STORAGE_KEY = "flow.quiz.v1";

function saveResult(slug: string, score: number, total: number) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? "{}";
    const store = JSON.parse(raw) as Record<string, unknown>;
    store[slug] = { score, total, completedAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export default function QuizPage() {
  const params = useParams<{ chapter: string }>();
  const quiz = QUIZZES_BY_SLUG[params.chapter];

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<(string | boolean | null)[]>([]);
  const [committed, setCommitted] = useState<boolean[]>([]);
  const [done, setDone] = useState(false);

  const selectAnswer = useCallback(
    (ans: string | boolean) => {
      if (committed[current]) return;
      setAnswers((prev) => {
        const next = [...prev];
        next[current] = ans;
        return next;
      });
    },
    [current, committed],
  );

  const commit = useCallback(() => {
    const ans = answers[current];
    if (ans === undefined || ans === null) return;
    setCommitted((prev) => {
      const next = [...prev];
      next[current] = true;
      return next;
    });
  }, [current, answers]);

  const advance = useCallback(() => {
    if (current < (quiz?.questions.length ?? 0) - 1) {
      setCurrent((c) => c + 1);
    } else {
      const score = (quiz?.questions ?? []).filter(
        (q, i) => answers[i] === q.answer,
      ).length;
      saveResult(params.chapter, score, quiz?.questions.length ?? 0);
      setDone(true);
    }
  }, [current, quiz, answers, params.chapter]);

  if (!quiz) {
    return (
      <div style={{ padding: 32, color: color.text, minHeight: "100vh" }}>
        <p>Quiz not found.</p>
        <Link href="/levels" style={{ color: color.accent }}>← Back to levels</Link>
      </div>
    );
  }

  if (done) {
    const score = quiz.questions.filter((q, i) => answers[i] === q.answer).length;
    return <ScorePage quiz={quiz} score={score} answers={answers} />;
  }

  const question = quiz.questions[current];
  const userAnswer = answers[current] ?? null;
  const isCommitted = committed[current] ?? false;
  const isCorrect = isCommitted && userAnswer === question.answer;

  return (
    <div style={{ minHeight: "100vh", color: color.text, padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 2, color: color.accent, marginBottom: 4 }}>
          QUIZ · {quiz.chapter.toUpperCase()}
        </div>
        <h1 style={{ fontFamily: fontFamily.display, fontSize: 26, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 4px" }}>
          {quiz.title}
        </h1>
        <p style={{ color: color.textMuted, fontSize: 13, margin: "0 0 24px" }}>{quiz.description}</p>

        {/* Progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: fontFamily.mono, fontSize: 10, color: color.textMuted, letterSpacing: 1, marginBottom: 6 }}>
            <span>QUESTION {current + 1} / {quiz.questions.length}</span>
            <span>{question.type === "true_false" ? "TRUE / FALSE" : "MULTIPLE CHOICE"}</span>
          </div>
          <div style={{ height: 4, background: color.bgRaised, border: `1px solid ${color.borderStrong}` }}>
            <div style={{ width: `${((current + (isCommitted ? 1 : 0)) / quiz.questions.length) * 100}%`, height: "100%", background: color.accent, transition: "width 200ms ease" }} />
          </div>
        </div>

        {/* Question card */}
        <div
          className="flow-panel"
          style={{
            padding: "20px 24px",
            marginBottom: 16,
            borderLeft: isCommitted
              ? `3px solid ${isCorrect ? color.success : color.danger}`
              : `3px solid ${color.borderStrong}`,
          }}
        >
          <p style={{ fontFamily: fontFamily.body, fontSize: 16, lineHeight: 1.6, margin: "0 0 20px" }}>
            {question.question}
          </p>

          {/* Answer options */}
          {question.type === "true_false" ? (
            <div style={{ display: "flex", gap: 12 }}>
              {([true, false] as const).map((opt) => (
                <AnswerButton
                  key={String(opt)}
                  label={opt ? "True" : "False"}
                  selected={userAnswer === opt}
                  correct={isCommitted ? opt === question.answer : undefined}
                  committed={isCommitted}
                  onClick={() => selectAnswer(opt)}
                />
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {question.options.map((opt) => (
                <AnswerButton
                  key={opt}
                  label={opt}
                  selected={userAnswer === opt}
                  correct={isCommitted ? opt === question.answer : undefined}
                  committed={isCommitted}
                  onClick={() => selectAnswer(opt)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Explanation */}
        {isCommitted && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 16,
              background: isCorrect ? "rgba(155, 227, 107, 0.08)" : "rgba(255, 92, 92, 0.08)",
              border: `1px solid ${isCorrect ? color.success : color.danger}`,
            }}
          >
            <div style={{ fontFamily: fontFamily.display, fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: isCorrect ? color.success : color.danger, marginBottom: 6 }}>
              {isCorrect ? "✓ Correct" : "✗ Incorrect"}
            </div>
            <p style={{ margin: 0, fontSize: 13, color: color.text, lineHeight: 1.6 }}>
              {question.explanation}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12 }}>
          {!isCommitted ? (
            <button
              type="button"
              disabled={userAnswer === null}
              onClick={commit}
              style={{
                ...actionBtnStyle,
                background: userAnswer !== null ? color.accent : color.bgRaised,
                color: userAnswer !== null ? color.accentInk : color.textMuted,
                cursor: userAnswer !== null ? "pointer" : "not-allowed",
                border: `1px solid ${userAnswer !== null ? color.accent : color.borderStrong}`,
              }}
            >
              CHECK ANSWER
            </button>
          ) : (
            <button type="button" onClick={advance} style={{ ...actionBtnStyle, background: color.accent, color: color.accentInk, border: `1px solid ${color.accent}`, cursor: "pointer" }}>
              {current < quiz.questions.length - 1 ? "NEXT QUESTION →" : "SEE RESULTS →"}
            </button>
          )}
          <Link
            href="/levels"
            style={{ ...actionBtnStyle, color: color.textMuted, border: `1px solid ${color.borderStrong}`, textDecoration: "none", background: "transparent", display: "inline-flex", alignItems: "center" }}
          >
            ← LEVELS
          </Link>
        </div>
      </div>
    </div>
  );
}

function AnswerButton({
  label,
  selected,
  correct,
  committed,
  onClick,
}: {
  label: string;
  selected: boolean;
  correct: boolean | undefined;
  committed: boolean;
  onClick: () => void;
}) {
  let bg = "rgba(19, 36, 58, 0.7)";
  let borderColor: string = color.borderStrong;
  let textColor: string = color.text;

  if (committed && correct === true) {
    bg = "rgba(155, 227, 107, 0.12)";
    borderColor = color.success;
    textColor = color.success;
  } else if (committed && selected && correct === false) {
    bg = "rgba(255, 92, 92, 0.12)";
    borderColor = color.danger;
    textColor = color.danger;
  } else if (!committed && selected) {
    bg = "rgba(122, 223, 255, 0.10)";
    borderColor = color.accent;
    textColor = color.accent;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={committed}
      style={{
        flex: 1,
        padding: "10px 16px",
        background: bg,
        border: `1px solid ${borderColor}`,
        color: textColor,
        fontFamily: fontFamily.display,
        fontSize: 13,
        letterSpacing: 1,
        textAlign: "left",
        cursor: committed ? "default" : "pointer",
        transition: "background 100ms ease, border-color 100ms ease",
      }}
    >
      {label}
    </button>
  );
}

function ScorePage({
  quiz,
  score,
  answers,
}: {
  quiz: ChapterQuiz;
  score: number;
  answers: (string | boolean | null)[];
}) {
  const total = quiz.questions.length;
  const pct = Math.round((score / total) * 100);
  const passed = pct >= 80;

  return (
    <div style={{ minHeight: "100vh", color: color.text, padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <div style={{ fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 2, color: color.accent, marginBottom: 4 }}>
          QUIZ · {quiz.chapter.toUpperCase()} · RESULTS
        </div>
        <h1 style={{ fontFamily: fontFamily.display, fontSize: 26, letterSpacing: 2, textTransform: "uppercase", margin: "0 0 24px" }}>
          {quiz.title}
        </h1>

        {/* Score stamp */}
        <div
          className="flow-panel"
          style={{
            padding: "24px 28px",
            marginBottom: 24,
            borderLeft: `4px solid ${passed ? color.success : color.warning}`,
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: fontFamily.display, fontSize: 48, color: passed ? color.success : color.warning, lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ fontFamily: fontFamily.mono, fontSize: 10, color: color.textMuted, letterSpacing: 1, marginTop: 4 }}>
              / {total} CORRECT
            </div>
          </div>
          <div>
            <div style={{ fontFamily: fontFamily.display, fontSize: 22, letterSpacing: 1.5, color: passed ? color.success : color.warning }}>
              {pct}%
            </div>
            <div style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted, letterSpacing: 1, marginTop: 4 }}>
              {passed ? "✓ PASSED" : "REVIEW RECOMMENDED"}
            </div>
            {!passed && (
              <div style={{ fontSize: 12, color: color.textMuted, marginTop: 6 }}>
                Score ≥ 80% to pass. Revisit the chapter and retry.
              </div>
            )}
          </div>
        </div>

        {/* Review: question breakdown */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: fontFamily.mono, fontSize: 10, letterSpacing: 2, color: color.accent, marginBottom: 12 }}>
            REVIEW
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {quiz.questions.map((q: QuizQuestion, i: number) => {
              const userAns = answers[i];
              const correct = userAns === q.answer;
              return (
                <div
                  key={q.id}
                  style={{
                    padding: "12px 14px",
                    background: correct ? "rgba(155, 227, 107, 0.06)" : "rgba(255, 92, 92, 0.06)",
                    border: `1px solid ${correct ? color.success : color.danger}`,
                  }}
                >
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ fontFamily: fontFamily.mono, fontSize: 11, color: correct ? color.success : color.danger, minWidth: 16, marginTop: 1 }}>
                      {correct ? "✓" : "✗"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 6 }}>{q.question}</div>
                      {!correct && (
                        <div style={{ fontFamily: fontFamily.mono, fontSize: 11, color: color.textMuted }}>
                          Correct: <span style={{ color: color.success }}>{String(q.answer)}</span>
                          {" · "}Your answer: <span style={{ color: color.danger }}>{userAns === null ? "—" : String(userAns)}</span>
                        </div>
                      )}
                      <div style={{ fontSize: 12, color: color.textSubtle, marginTop: 4, lineHeight: 1.5 }}>
                        {q.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/levels"
            style={{ ...actionBtnStyle, background: color.accent, color: color.accentInk, border: `1px solid ${color.accent}`, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
          >
            ← BACK TO LEVELS
          </Link>
          <button
            type="button"
            onClick={() => {
              window.location.reload();
            }}
            style={{ ...actionBtnStyle, background: "transparent", color: color.textMuted, border: `1px solid ${color.borderStrong}`, cursor: "pointer" }}
          >
            RETRY QUIZ
          </button>
        </div>
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  fontFamily: fontFamily.display,
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase",
};
