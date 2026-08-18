import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../../../utils/axios';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaUpload, FaTrash, FaPlus, FaChevronDown, FaChevronRight, FaFileCsv, FaDownload, FaRandom, FaCopy } from 'react-icons/fa';
import QuizQuestions from './QuizQuestions';

const CSV_TEMPLATE = `quiz_number,question_number,question,option1,option2,option3,option4,answer,explanation,quiz_topic
1,1,Which scheduling algorithm can cause starvation?,Round Robin,Priority scheduling,FCFS,SJF (preemptive),B,Low-priority processes may never be scheduled.,Processes & scheduling
1,2,What does FCFS stand for?,First Come First Served,Fastest Case First Solve,Fixed Cycle Fair Scheduling,First Cycle First Solve,A,,Processes & scheduling
2,1,Which page replacement policy can suffer Belady's anomaly?,LRU,Optimal,FIFO,MRU,C,,Memory management
`

const downloadCsvTemplate = () => {
  const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'interview-prep-quiz-template.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const THEMES = ['blue', 'green', 'purple', 'orange', 'red', 'olive'];

const PackDetail = ({ isDarkMode }) => {
  const { packId } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const csvRef = useRef(null);

  const [pack, setPack] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [openQuizId, setOpenQuizId] = useState(null);
  const [shufflingId, setShufflingId] = useState(null);
  const [copyingId, setCopyingId] = useState(null);
  const [refreshTokens, setRefreshTokens] = useState({});
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvErrors, setCsvErrors] = useState(null);

  const card = isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const input = `w-full px-3 py-2 rounded-lg border text-sm ${
    isDarkMode
      ? 'bg-gray-900 border-gray-700 text-white placeholder-gray-500'
      : 'bg-white border-gray-300 text-gray-900'
  }`;
  const label = `block text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/scrib/admin/packs/${packId}/`);
      setPack(res.data.pack);
      setQuizzes(res.data.quizzes || []);
    } catch (error) {
      toast.error('Could not load that pack');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [packId]);

  useEffect(() => {
    load();
  }, [load]);

  const savePack = async () => {
    try {
      setSaving(true);
      const res = await axios.patch(`/scrib/admin/packs/${packId}/`, {
        title: pack.title,
        category: pack.category,
        description: pack.description,
        theme: pack.theme,
        price_paise: pack.price_paise,
        free_page_count: pack.free_page_count,
        sort_order: pack.sort_order,
        is_active: pack.is_active,
      });
      setPack(res.data);
      toast.success('Saved');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const uploadPdf = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('Pick a PDF file');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    try {
      setUploading(true);
      const res = await axios.post(`/scrib/admin/packs/${packId}/pdf-upload/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(`Uploaded — ${res.data.page_count} pages`);
      if (!res.data.free_preview_ready) {
        toast.error('The free preview could not be generated — check the server logs');
      }
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const importCsv = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Pick a .csv file');
      return;
    }
    const form = new FormData();
    form.append('file', file);
    try {
      setImportingCsv(true);
      setCsvErrors(null);
      const res = await axios.post(`/scrib/admin/packs/${packId}/quizzes/import-csv/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(
        `Imported ${res.data.questions_created} questions across ${res.data.quizzes_touched} quiz(zes)`,
      );
      load();
    } catch (error) {
      const details = error.response?.data?.details;
      if (details?.errors?.length) {
        setCsvErrors({ list: details.errors, total: details.total_errors ?? details.errors.length });
        toast.error(`${details.total_errors ?? details.errors.length} row(s) had problems — nothing was saved`);
      } else {
        toast.error(error.response?.data?.message || 'CSV import failed');
      }
    } finally {
      setImportingCsv(false);
      if (csvRef.current) csvRef.current.value = '';
    }
  };

  const addQuiz = async () => {
    try {
      const res = await axios.post(`/scrib/admin/packs/${packId}/quizzes/`, {
        topic: '',
        is_active: true,
      });
      setQuizzes((prev) => [...prev, res.data]);
      setOpenQuizId(res.data.id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not add a quiz');
    }
  };

  const updateQuiz = async (quiz, patch) => {
    try {
      const res = await axios.patch(`/scrib/admin/quizzes/${quiz.id}/`, patch);
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? res.data : q)));
    } catch (error) {
      toast.error('Could not update the quiz');
    }
  };

  const shuffleOptions = async (quiz) => {
    try {
      setShufflingId(quiz.id);
      const res = await axios.post(`/scrib/admin/quizzes/${quiz.id}/shuffle-options/`);
      toast.success(
        res.data.shuffled > 0
          ? `Shuffled ${res.data.shuffled} question(s) — answers still correct, just reordered`
          : 'This quiz has no questions to shuffle yet',
      );
      // Force the question editor to re-fetch if it's open, so the admin sees
      // the new order immediately instead of a stale cached list.
      setRefreshTokens((prev) => ({ ...prev, [quiz.id]: (prev[quiz.id] || 0) + 1 }));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not shuffle this quiz');
    } finally {
      setShufflingId(null);
    }
  };

  // Same shape the "Bulk import JSON" box in QuizQuestions.jsx accepts — id,
  // quiz and order are this quiz's own bookkeeping, not useful to whoever
  // pastes this in (a new quiz gets its own ids/order), so they're dropped.
  const copyQuizJson = async (quiz) => {
    try {
      setCopyingId(quiz.id);
      const res = await axios.get(`/scrib/admin/quizzes/${quiz.id}/questions/`);
      const questions = (res.data.results || []).map(({ text, options, correct_index, explanation }) => ({
        text,
        options,
        correct_index,
        explanation,
      }));
      await navigator.clipboard.writeText(JSON.stringify(questions, null, 2));
      toast.success(`Copied ${questions.length} question(s) to clipboard`);
    } catch (error) {
      toast.error('Could not copy this quiz');
    } finally {
      setCopyingId(null);
    }
  };

  const deleteQuiz = async (quiz) => {
    if (!window.confirm(`Delete ${quiz.title || `Quiz ${quiz.number}`} and all its questions?`)) return;
    try {
      await axios.delete(`/scrib/admin/quizzes/${quiz.id}/`);
      setQuizzes((prev) => prev.filter((q) => q.id !== quiz.id));
      toast.success('Quiz deleted');
    } catch (error) {
      toast.error('Could not delete the quiz');
    }
  };

  const deletePack = async () => {
    if (!window.confirm(`Delete "${pack.title}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/scrib/admin/packs/${packId}/`);
      toast.success('Pack deleted');
      navigate('/admin-p/interview-prep');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete the pack');
    }
  };

  if (loading || !pack) {
    return (
      <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading…</div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/admin-p/interview-prep')}
        className={`flex items-center gap-2 text-sm font-medium ${
          isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'
        }`}
      >
        <FaArrowLeft /> All packs
      </button>

      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            {pack.title}
          </h2>
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {pack.category} · /{pack.slug} · {pack.purchase_count} sold
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={deletePack}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              isDarkMode ? 'border-red-800 text-red-400' : 'border-red-200 text-red-600'
            }`}
          >
            Delete
          </button>
          <button
            onClick={savePack}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>

      {/* ── PDF ── */}
      <div className={`rounded-xl border shadow-sm p-6 ${card}`}>
        <h3 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>PDF</h3>
        <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Uploading stores the file in S3 and rebuilds the free preview. Readers who have not paid only
          ever receive the first {pack.free_page_count} pages.
        </p>

        <div className="flex items-center gap-4 flex-wrap">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => uploadPdf(e.target.files?.[0])}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
          >
            <FaUpload /> {uploading ? 'Uploading…' : pack.has_pdf ? 'Replace PDF' : 'Upload PDF'}
          </button>

          {pack.has_pdf ? (
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {pack.page_count} pages · first {pack.free_page_count} free
            </span>
          ) : (
            <span className="text-sm text-amber-500 font-medium">No PDF uploaded yet</span>
          )}
        </div>
      </div>

      {/* ── Details ── */}
      <div className={`rounded-xl border shadow-sm p-6 ${card}`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          Details
        </h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className={label}>Title</label>
            <input
              className={input}
              value={pack.title}
              onChange={(e) => setPack({ ...pack, title: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Subject</label>
            <input
              className={input}
              value={pack.category}
              onChange={(e) => setPack({ ...pack, category: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={label}>Description</label>
            <textarea
              className={input}
              rows="2"
              value={pack.description || ''}
              onChange={(e) => setPack({ ...pack, description: e.target.value })}
            />
          </div>
          <div>
            <label className={label}>Price (₹)</label>
            <input
              type="number"
              min="0"
              className={input}
              value={pack.price_paise / 100}
              onChange={(e) =>
                setPack({ ...pack, price_paise: Math.round(Number(e.target.value) * 100) })
              }
            />
          </div>
          <div>
            <label className={label}>Free pages</label>
            <input
              type="number"
              min="1"
              className={input}
              value={pack.free_page_count}
              onChange={(e) => setPack({ ...pack, free_page_count: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className={label}>Card colour</label>
            <select
              className={input}
              value={pack.theme}
              onChange={(e) => setPack({ ...pack, theme: e.target.value })}
            >
              {THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={label}>Sort order</label>
            <input
              type="number"
              className={input}
              value={pack.sort_order}
              onChange={(e) => setPack({ ...pack, sort_order: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input
                type="checkbox"
                checked={pack.is_active}
                onChange={(e) => setPack({ ...pack, is_active: e.target.checked })}
              />
              Show this pack on the site
            </label>
          </div>
        </div>
      </div>

      {/* ── Quizzes ── */}
      <div className={`rounded-xl border shadow-sm p-6 ${card}`}>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
              Quizzes
            </h3>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {quizzes.length} quiz{quizzes.length === 1 ? '' : 'zes'} ·{' '}
              {quizzes.reduce((sum, q) => sum + (q.question_count || 0), 0)} questions
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={downloadCsvTemplate}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
                isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FaDownload /> Template
            </button>
            <input
              ref={csvRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => importCsv(e.target.files?.[0])}
            />
            <button
              onClick={() => csvRef.current?.click()}
              disabled={importingCsv}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium"
            >
              <FaFileCsv /> {importingCsv ? 'Importing…' : 'Import CSV'}
            </button>
            <button
              onClick={addQuiz}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
            >
              <FaPlus /> Add quiz
            </button>
          </div>
        </div>

        <p className={`text-xs mb-4 -mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          CSV columns: <code>quiz_number, question, option1, option2, option3, option4, answer</code> — one file can
          fill every quiz in this pack at once. <code>answer</code> takes a number (2), a letter (B), or the exact
          option text. Optional: <code>question_number</code>, <code>explanation</code>, <code>quiz_topic</code>.
        </p>

        {csvErrors && (
          <div className={`mb-4 rounded-lg border p-4 ${isDarkMode ? 'border-red-800 bg-red-950/30' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>
                {csvErrors.total} row(s) could not be imported — nothing was saved. Fix these and re-upload.
              </p>
              <button
                onClick={() => setCsvErrors(null)}
                className={isDarkMode ? 'text-red-300' : 'text-red-500'}
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
            <ul className={`mt-2 max-h-48 overflow-y-auto text-xs space-y-1 ${isDarkMode ? 'text-red-200' : 'text-red-600'}`}>
              {csvErrors.list.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {csvErrors.total > csvErrors.list.length && (
              <p className={`mt-2 text-xs italic ${isDarkMode ? 'text-red-300' : 'text-red-500'}`}>
                …and {csvErrors.total - csvErrors.list.length} more.
              </p>
            )}
          </div>
        )}

        {quizzes.length === 0 && (
          <p className={`text-sm py-6 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            No quizzes yet.
          </p>
        )}

        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const open = openQuizId === quiz.id;
            return (
              <div
                key={quiz.id}
                className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                <div className="flex items-center gap-3 p-3 flex-wrap">
                  <button
                    onClick={() => setOpenQuizId(open ? null : quiz.id)}
                    className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}
                    aria-label={open ? 'Collapse' : 'Expand'}
                  >
                    {open ? <FaChevronDown /> : <FaChevronRight />}
                  </button>

                  <span className={`font-bold text-sm w-16 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Quiz {quiz.number}
                  </span>

                  <input
                    className={`${input} flex-1 min-w-[180px]`}
                    placeholder="Topic — e.g. Processes & scheduling"
                    defaultValue={quiz.topic}
                    onBlur={(e) => {
                      if (e.target.value !== quiz.topic) updateQuiz(quiz, { topic: e.target.value });
                    }}
                  />

                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      quiz.question_count > 0
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {quiz.question_count} Qs
                  </span>

                  <label className={`flex items-center gap-1.5 text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <input
                      type="checkbox"
                      checked={quiz.is_active}
                      onChange={(e) => updateQuiz(quiz, { is_active: e.target.checked })}
                    />
                    Live
                  </label>

                  <button
                    onClick={() => shuffleOptions(quiz)}
                    disabled={shufflingId === quiz.id || quiz.question_count === 0}
                    title="Randomize each question's option order (the correct answer moves with its text)"
                    className={`p-1 disabled:opacity-40 ${
                      isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    aria-label="Shuffle option order"
                  >
                    <FaRandom className={shufflingId === quiz.id ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={() => copyQuizJson(quiz)}
                    disabled={copyingId === quiz.id || quiz.question_count === 0}
                    title="Copy this quiz's questions, options and answers as JSON"
                    className={`p-1 disabled:opacity-40 ${
                      isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-500 hover:text-gray-800'
                    }`}
                    aria-label="Copy quiz as JSON"
                  >
                    <FaCopy />
                  </button>

                  <button
                    onClick={() => deleteQuiz(quiz)}
                    className="text-red-500 hover:text-red-600 p-1"
                    aria-label="Delete quiz"
                  >
                    <FaTrash />
                  </button>
                </div>

                {open && (
                  <div className={`border-t p-4 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <QuizQuestions
                      key={`${quiz.id}-${refreshTokens[quiz.id] || 0}`}
                      quizId={quiz.id}
                      isDarkMode={isDarkMode}
                      onCountChange={(count) =>
                        setQuizzes((prev) =>
                          prev.map((q) => (q.id === quiz.id ? { ...q, question_count: count } : q)),
                        )
                      }
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PackDetail;
