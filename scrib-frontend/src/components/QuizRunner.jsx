import { useEffect, useMemo, useState } from 'react'
import customToast from '../utils/customToast'
import { fetchQuiz, submitQuiz } from '../services/packs'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Full-screen quiz attempt: one question at a time, then a review screen.
 *
 * Answers are graded on the server — this component never receives the correct
 * option until the attempt has been submitted.
 */
const QuizRunner = ({ quiz, onClose, onFinished }) => {
  const [questions, setQuestions] = useState([])
  const [meta, setMeta] = useState(null)
  const [answers, setAnswers] = useState({})
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    let alive = true

    fetchQuiz(quiz.id)
      .then((data) => {
        if (!alive) return
        setQuestions(data.questions || [])
        setMeta(data.quiz)
      })
      .catch((error) => {
        customToast.error(error?.response?.data?.message || 'Could not open that quiz')
        onClose()
      })
      .finally(() => alive && setLoading(false))

    return () => { alive = false }
  }, [quiz.id, onClose])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !result) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, result])

  const answeredCount = Object.keys(answers).length
  const current = questions[index]
  const resultsById = useMemo(() => {
    const map = {}
    for (const row of result?.results || []) map[row.question_id] = row
    return map
  }, [result])

  const choose = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }))
  }

  const submit = async () => {
    if (answeredCount < questions.length) {
      const left = questions.length - answeredCount
      if (!window.confirm(`${left} question${left === 1 ? '' : 's'} left unanswered. Submit anyway?`)) return
    }
    try {
      setSubmitting(true)
      setResult(await submitQuiz(quiz.id, answers))
    } catch (error) {
      customToast.error(error?.response?.data?.message || 'Could not submit your answers')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#f8f7f3]">
      <div className="sticky top-0 z-10 border-b border-[#e2dbd2] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold">{meta?.title || quiz.title}</p>
            <p className="text-[11.5px] text-[#9a9289]">
              {meta?.pack_title}{meta?.topic ? ` · ${meta.topic}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {!result && questions.length > 0 && (
              <span className="hidden text-[12px] font-semibold text-[#7b756d] sm:inline">
                {answeredCount} / {questions.length} answered
              </span>
            )}
            <button
              onClick={result ? onFinished : onClose}
              className="rounded-full border border-[#d9d1c7] bg-white px-3.5 py-1.5 text-xs font-bold hover:bg-[#faf8f3]"
            >
              {result ? 'Done' : 'Close'}
            </button>
          </div>
        </div>

        {!result && questions.length > 0 && (
          <div className="h-1 w-full bg-[#f4f1ea]">
            <div
              className="h-full bg-[#1f3a5f] transition-all"
              style={{ width: `${((index + 1) / questions.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 py-7 md:px-6">
        {loading && <p className="py-16 text-center text-sm text-[#9a9289]">Loading questions…</p>}

        {!loading && questions.length === 0 && (
          <p className="py-16 text-center text-sm text-[#9a9289]">This quiz has no questions yet.</p>
        )}

        {/* ── Attempt ── */}
        {!loading && !result && current && (
          <>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9289]">
              Question {index + 1} of {questions.length}
            </p>
            <h2 className="mt-3 text-[19px] font-bold leading-snug">{current.text}</h2>

            <div className="mt-6 flex flex-col gap-2.5">
              {current.options.map((option, optionIndex) => {
                const selected = answers[current.id] === optionIndex
                return (
                  <button
                    key={optionIndex}
                    onClick={() => choose(current.id, optionIndex)}
                    className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-colors ${
                      selected
                        ? 'border-[#1f3a5f] bg-[#eef2f7]'
                        : 'border-[#e2dbd2] bg-white hover:border-[#cfc7bd] hover:bg-[#faf8f3]'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        selected ? 'bg-[#1f3a5f] text-white' : 'bg-[#f4f1ea] text-[#7b756d]'
                      }`}
                    >
                      {LETTERS[optionIndex] || optionIndex + 1}
                    </span>
                    <span className="text-[14px] leading-relaxed">{option}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3">
              <button
                onClick={() => setIndex((i) => Math.max(i - 1, 0))}
                disabled={index === 0}
                className="rounded-xl border border-[#d9d1c7] bg-white px-4 py-2.5 text-[13px] font-bold disabled:opacity-40"
              >
                Previous
              </button>

              {index < questions.length - 1 ? (
                <button
                  onClick={() => setIndex((i) => i + 1)}
                  className="rounded-xl bg-[#1f1f1f] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-black"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-xl bg-[#1f3a5f] px-6 py-2.5 text-[13px] font-bold text-white hover:bg-[#2d5fa6] disabled:opacity-60"
                >
                  {submitting ? 'Submitting…' : 'Submit answers'}
                </button>
              )}
            </div>

            {/* jump-to-question strip */}
            <div className="mt-8 flex flex-wrap gap-1.5 border-t border-[#e2dbd2] pt-5">
              {questions.map((question, questionIndex) => (
                <button
                  key={question.id}
                  onClick={() => setIndex(questionIndex)}
                  className={`h-7 w-7 rounded-lg text-[11px] font-bold transition-colors ${
                    questionIndex === index
                      ? 'bg-[#1f3a5f] text-white'
                      : answers[question.id] !== undefined
                        ? 'bg-[#eef7df] text-[#557a3f]'
                        : 'bg-white text-[#9a9289] border border-[#e2dbd2]'
                  }`}
                  title={`Question ${questionIndex + 1}`}
                >
                  {questionIndex + 1}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Review ── */}
        {result && (
          <>
            <div className="rounded-2xl border border-[#e2dbd2] bg-white p-7 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#9a9289]">Your score</p>
              <p className="mt-2 text-[40px] font-bold leading-none" style={{ fontFamily: 'Sora, sans-serif' }}>
                {result.score}
                <span className="text-[22px] text-[#9a9289]"> / {result.total}</span>
              </p>
              <p className="mt-3 text-[13px] text-[#7b756d]">
                {result.score === result.total
                  ? 'Every question correct.'
                  : `Best so far: ${result.best_score} / ${result.total}`}
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <button
                  onClick={() => {
                    setResult(null)
                    setAnswers({})
                    setIndex(0)
                  }}
                  className="rounded-xl border border-[#d9d1c7] bg-white px-5 py-2.5 text-[13px] font-bold hover:bg-[#faf8f3]"
                >
                  Try again
                </button>
                <button
                  onClick={onFinished}
                  className="rounded-xl bg-[#1f1f1f] px-5 py-2.5 text-[13px] font-bold text-white hover:bg-black"
                >
                  Back to quizzes
                </button>
              </div>
            </div>

            <h3 className="mt-8 mb-4 text-[15px] font-bold">Review</h3>
            <div className="flex flex-col gap-3.5">
              {questions.map((question, questionIndex) => {
                const row = resultsById[question.id]
                const chosen = row?.chosen_index
                return (
                  <div
                    key={question.id}
                    className={`rounded-xl border bg-white p-4 ${
                      row?.correct ? 'border-[#dbe8c3]' : 'border-[#f0d0d0]'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${
                          row?.correct ? 'bg-[#557a3f]' : 'bg-[#c05252]'
                        }`}
                      >
                        {row?.correct ? '✓' : '✕'}
                      </span>
                      <p className="text-[14px] font-semibold leading-snug">
                        {questionIndex + 1}. {question.text}
                      </p>
                    </div>

                    <div className="mt-3 flex flex-col gap-1.5 pl-7">
                      {question.options.map((option, optionIndex) => {
                        const isCorrect = optionIndex === row?.correct_index
                        const isChosen = optionIndex === chosen
                        return (
                          <div
                            key={optionIndex}
                            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] ${
                              isCorrect
                                ? 'bg-[#eef7df] font-semibold text-[#3f5c2f]'
                                : isChosen
                                  ? 'bg-[#fbeeee] text-[#a64a4a]'
                                  : 'text-[#7b756d]'
                            }`}
                          >
                            <span className="text-[10px] font-bold">{LETTERS[optionIndex] || optionIndex + 1}</span>
                            <span>{option}</span>
                            {isCorrect && <span className="ml-auto text-[10.5px] font-bold">Correct</span>}
                            {isChosen && !isCorrect && (
                              <span className="ml-auto text-[10.5px] font-bold">Your answer</span>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {row?.explanation && (
                      <p className="mt-3 border-t border-[#f4f1ea] pl-7 pt-3 text-[12.5px] leading-relaxed text-[#7b756d]">
                        {row.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default QuizRunner
