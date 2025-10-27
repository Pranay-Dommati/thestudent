import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiAxios from '../../../utils/axios';
import { IoBook, IoFilm, IoList, IoLink, IoTimeOutline, IoChevronBack } from 'react-icons/io5';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`}
  >
    <Icon size={16} />
    {children}
  </button>
);

const TopicViewer = ({ topic }) => {
  const [tab, setTab] = useState('reading');

  const videos = Array.isArray(topic.videos) ? topic.videos : [];
  const resources = Array.isArray(topic.resources) ? topic.resources : [];
  const quiz = Array.isArray(topic.quiz_questions) ? topic.quiz_questions : [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-100 bg-gray-50">
        <div className="font-semibold text-gray-900">{topic.topic_name || topic.name}</div>
        <div className="flex gap-2">
          <TabButton active={tab==='reading'} onClick={()=>setTab('reading')} icon={IoBook}>Reading</TabButton>
          <TabButton active={tab==='summary'} onClick={()=>setTab('summary')} icon={IoList}>Summary</TabButton>
          <TabButton active={tab==='videos'} onClick={()=>setTab('videos')} icon={IoFilm}>Videos</TabButton>
          <TabButton active={tab==='resources'} onClick={()=>setTab('resources')} icon={IoLink}>Resources</TabButton>
        </div>
      </div>

      <div className="p-4">
        {tab === 'reading' && (
          <div className="prose prose-sm max-w-none">
            {topic.reading_material ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.reading_material}</ReactMarkdown>
            ) : (
              <div className="text-gray-500 text-sm">No reading content available for this topic.</div>
            )}
          </div>
        )}
        {tab === 'summary' && (
          <div className="prose prose-sm max-w-none">
            {topic.summary ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{topic.summary}</ReactMarkdown>
            ) : (
              <div className="text-gray-500 text-sm">No summary available for this topic.</div>
            )}
          </div>
        )}
        {tab === 'videos' && (
          <div className="space-y-2">
            {videos.length === 0 && (
              <div className="text-gray-500 text-sm">No videos for this topic.</div>
            )}
            {videos.map(v => (
              <a key={v.id} href={v.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="w-8 h-8 rounded-md bg-red-600 text-white flex items-center justify-center mr-3">
                  <IoFilm size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{v.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <IoTimeOutline />
                    {v.duration || 'video'}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
        {tab === 'resources' && (
          <div className="space-y-2">
            {resources.length === 0 && (
              <div className="text-gray-500 text-sm">No resources for this topic.</div>
            )}
            {resources.map(r => (
              <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer" className="block p-2 rounded-lg border border-gray-200 hover:bg-indigo-50 hover:border-indigo-200 transition-colors">
                <div className="text-sm font-medium text-gray-900">{r.title}</div>
                {r.description && <div className="text-xs text-gray-600 mt-0.5 line-clamp-2">{r.description}</div>}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SharedProLearningPage = () => {
  const { shareId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [selectedTopicId, setSelectedTopicId] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const { data } = await apiAxios.get(`/courses/pro-learning/share/${shareId}/`);
        if (ignore) return;
        setCourse(data);
        const firstTopicId = data?.topics?.[0]?.id || null;
        setSelectedTopicId(firstTopicId);
      } catch (err) {
        console.error('Failed to fetch shared course:', err);
        setError(err?.response?.data?.detail || 'This shared link is not available.');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [shareId]);

  const selectedTopic = useMemo(() => {
    if (!course || !selectedTopicId) return null;
    return (course.topics || []).find(t => t.id === selectedTopicId) || null;
  }, [course, selectedTopicId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">
          <div className="font-semibold mb-1">Link unavailable</div>
          <div className="text-sm">{String(error)}</div>
          <div className="mt-3">
            <Link to="/chat" className="text-sm text-red-700 underline">Go to Course Creator</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Link to="/chat" className="text-gray-600 hover:text-gray-800 flex items-center gap-2 text-sm">
          <IoChevronBack /> Back to Course Creator
        </Link>
      </div>

      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{course?.course_name || 'Shared Course'}</h1>
        {course?.description && (
          <p className="text-gray-600 mt-1">{course.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 p-3 h-fit sticky top-4">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">Topics</div>
          <div className="space-y-1">
            {(course?.topics || []).map(t => (
              <button key={t.id} onClick={() => setSelectedTopicId(t.id)} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTopicId === t.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}>
                {t.topic_name || t.name}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-3">
          {selectedTopic ? (
            <TopicViewer topic={selectedTopic} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-gray-500">Select a topic to view content.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SharedProLearningPage;
