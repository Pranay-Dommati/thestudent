import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaPlus, FaTrash, FaFileImport } from 'react-icons/fa';

const BLANK = { text: '', options: ['', '', '', ''], correct_index: 0, explanation: '' };

const SAMPLE_IMPORT = `[
  {
    "text": "Which scheduling algorithm can cause starvation?",
    "options": ["Round Robin", "Priority scheduling", "FCFS", "SJF (preemptive)"],
    "correct_index": 1,
    "explanation": "Low-priority processes may never be scheduled."
  }
]`;

/**
 * Question editor for one quiz. Questions are edited in place and saved on blur;
 * the bulk importer takes a JSON array so a full 25-question set can be pasted
 * in one go rather than typed one at a time.
 */
const QuizQuestions = ({ quizId, isDarkMode, onCountChange }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(BLANK);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importing, setImporting] = useState(false);

  const input = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900'
  }`;
  const muted = isDarkMode ? 'text-gray-400' : 'text-gray-500';

  // PackDetail passes a fresh onCountChange function on every render (it's an
  // inline closure over `quiz.id`). Reading it through a ref — rather than
  // depending on it directly — keeps `load` stable across those renders, so
  // the fetch effect below runs once per quiz instead of looping forever:
  // fetch -> onCountChange -> parent re-render -> new onCountChange -> fetch again.
  const onCountChangeRef = useRef(onCountChange);
  useEffect(() => {
    onCountChangeRef.current = onCountChange;
  }, [onCountChange]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/scrib/admin/quizzes/${quizId}/questions/`);
      const rows = res.data.results || [];
      setQuestions(rows);
      onCountChangeRef.current?.(rows.length);
    } catch (error) {
      toast.error('Could not load questions');
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    load();
  }, [load]);

  const saveQuestion = async (question, patch) => {
    try {
      const res = await axios.patch(`/scrib/admin/questions/${question.id}/`, patch);
      setQuestions((prev) => prev.map((q) => (q.id === question.id ? res.data : q)));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save the question');
    }
  };

  const addQuestion = async () => {
    if (!draft.text.trim()) {
      toast.error('Write the question first');
      return;
    }
    if (draft.options.filter((o) => o.trim()).length < 2) {
      toast.error('Give at least two answer options');
      return;
    }
    try {
      setAdding(true);
      const res = await axios.post(`/scrib/admin/quizzes/${quizId}/questions/`, {
        ...draft,
        options: draft.options.filter((o) => o.trim()),
      });
      const created = res.data.results || [];
      const next = [...questions, ...created];
      setQuestions(next);
      onCountChangeRef.current?.(next.length);
      setDraft(BLANK);
      toast.success('Question added');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add the question');
    } finally {
      setAdding(false);
    }
  };

  const deleteQuestion = async (question) => {
    try {
      await axios.delete(`/scrib/admin/questions/${question.id}/`);
      const next = questions.filter((q) => q.id !== question.id);
      setQuestions(next);
      onCountChangeRef.current?.(next.length);
    } catch (error) {
      toast.error('Could not delete the question');
    }
  };

  const runImport = async () => {
    let parsed;
    try {
      parsed = JSON.parse(importText);
    } catch (error) {
      toast.error('That is not valid JSON');
      return;
    }
    if (!Array.isArray(parsed)) {
      toast.error('The JSON must be an array of questions');
      return;
    }
    try {
      setImporting(true);
      const res = await axios.post(`/scrib/admin/quizzes/${quizId}/questions/`, {
        questions: parsed,
      });
      toast.success(`Imported ${res.data.created} questions`);
      setImportText('');
      setShowImport(false);
      load();
    } catch (error) {
      const details = error.response?.data?.details?.items;
      if (details?.length) {
        const first = details[0];
        toast.error(`Question ${first.index + 1}: ${JSON.stringify(first.errors)}`);
      } else {
        toast.error(error.response?.data?.message || 'Import failed');
      }
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return <p className={`text-sm ${muted}`}>Loading questions…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <p className={`text-sm ${muted}`}>{questions.length} question(s)</p>
        <button
          onClick={() => setShowImport(!showImport)}
          className={`flex items-center gap-2 text-sm font-medium ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`}
        >
          <FaFileImport /> {showImport ? 'Hide importer' : 'Bulk import JSON'}
        </button>
      </div>

      {showImport && (
        <div className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <p className={`text-xs mb-2 ${muted}`}>
            Paste an array of questions. <code>correct_index</code> is 0-based and points into{' '}
            <code>options</code>.
          </p>
          <textarea
            className={`${input} font-mono text-xs`}
            rows="8"
            placeholder={SAMPLE_IMPORT}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={runImport}
              disabled={importing || !importText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
            >
              {importing ? 'Importing…' : 'Import'}
            </button>
          </div>
        </div>
      )}

      {/* existing questions */}
      <div className="space-y-3">
        {questions.map((question, index) => (
          <div
            key={question.id}
            className={`rounded-lg border p-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
          >
            <div className="flex gap-2 items-start">
              <span className={`text-xs font-bold pt-2 w-6 ${muted}`}>{index + 1}.</span>
              <textarea
                className={input}
                rows="2"
                defaultValue={question.text}
                onBlur={(e) => {
                  if (e.target.value !== question.text) saveQuestion(question, { text: e.target.value });
                }}
              />
              <button
                onClick={() => deleteQuestion(question)}
                className="text-red-500 hover:text-red-600 p-2"
                aria-label="Delete question"
              >
                <FaTrash />
              </button>
            </div>

            <div className="mt-2 pl-8 space-y-2">
              {question.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={question.correct_index === optionIndex}
                    onChange={() => saveQuestion(question, { correct_index: optionIndex })}
                    title="Mark as the correct answer"
                  />
                  <input
                    className={input}
                    defaultValue={option}
                    onBlur={(e) => {
                      if (e.target.value === option) return;
                      const options = [...question.options];
                      options[optionIndex] = e.target.value;
                      saveQuestion(question, { options });
                    }}
                  />
                </label>
              ))}

              <input
                className={input}
                placeholder="Explanation (shown after they answer)"
                defaultValue={question.explanation}
                onBlur={(e) => {
                  if (e.target.value !== question.explanation) {
                    saveQuestion(question, { explanation: e.target.value });
                  }
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* new question */}
      <div className={`rounded-lg border border-dashed p-3 ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
        <textarea
          className={input}
          rows="2"
          placeholder="New question…"
          value={draft.text}
          onChange={(e) => setDraft({ ...draft, text: e.target.value })}
        />
        <div className="mt-2 space-y-2">
          {draft.options.map((option, index) => (
            <label key={index} className="flex items-center gap-2">
              <input
                type="radio"
                name="draft-correct"
                checked={draft.correct_index === index}
                onChange={() => setDraft({ ...draft, correct_index: index })}
                title="Mark as the correct answer"
              />
              <input
                className={input}
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) => {
                  const options = [...draft.options];
                  options[index] = e.target.value;
                  setDraft({ ...draft, options });
                }}
              />
            </label>
          ))}
        </div>
        <div className="mt-2 flex justify-end">
          <button
            onClick={addQuestion}
            disabled={adding}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
          >
            <FaPlus /> {adding ? 'Adding…' : 'Add question'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizQuestions;
