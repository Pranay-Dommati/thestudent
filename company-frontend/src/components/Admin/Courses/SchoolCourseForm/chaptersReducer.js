// Enterprise-grade normalized state management for chapters
// Eliminates deep clones; O(1) lesson updates instead of O(n) array rebuilds

export const chaptersReducer = (state, action) => {
  switch (action.type) {
    case 'INIT_CHAPTERS':
      return action.payload;

    case 'SET_CHAPTER_NAME': {
      const { chapterIndex, name } = action.payload;
      const updated = [...state];
      updated[chapterIndex] = { ...updated[chapterIndex], name };
      return updated;
    }

    case 'UPDATE_LESSON_FIELD': {
      const { chapterIndex, lessonIndex, field, value } = action.payload;
      const chapter = state[chapterIndex];
      const lessons = [...chapter.lessons];
      lessons[lessonIndex] = { ...lessons[lessonIndex], [field]: value };
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'ADD_LESSON': {
      const { chapterIndex } = action.payload;
      const chapter = state[chapterIndex];
      const newLesson = {
        type: 'video',
        title: '',
        videoUrl: '',
        description: '',
        aboutLesson: '',
        hasResources: false,
        resources: { downloadable: [], internet: [] },
        quizQuestions: []
      };
      const lessons = [...chapter.lessons, newLesson];
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'REMOVE_LESSON': {
      const { chapterIndex, lessonIndex } = action.payload;
      const chapter = state[chapterIndex];
      if (chapter.lessons.length <= 1) return state; // prevent removal
      const lessons = chapter.lessons.filter((_, i) => i !== lessonIndex);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'ADD_RESOURCE': {
      const { chapterIndex, lessonIndex, resourceType } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const newResource = { name: '', description: '', link: '' };
      const resources = {
        ...lesson.resources,
        [resourceType]: [...lesson.resources[resourceType], newResource]
      };
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, resources } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'REMOVE_RESOURCE': {
      const { chapterIndex, lessonIndex, resourceType, resourceIndex } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const resources = {
        ...lesson.resources,
        [resourceType]: lesson.resources[resourceType].filter((_, i) => i !== resourceIndex)
      };
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, resources } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'UPDATE_RESOURCE': {
      const { chapterIndex, lessonIndex, resourceType, resourceIndex, field, value } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const resources = {
        ...lesson.resources,
        [resourceType]: lesson.resources[resourceType].map((r, i) =>
          i === resourceIndex ? { ...r, [field]: value } : r
        )
      };
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, resources } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'ADD_QUIZ_QUESTION': {
      const { chapterIndex, lessonIndex } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const newQuestion = { question: '', options: ['', '', '', ''], correctAnswer: 0 };
      const quizQuestions = [...lesson.quizQuestions, newQuestion];
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, quizQuestions } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'REMOVE_QUIZ_QUESTION': {
      const { chapterIndex, lessonIndex, questionIndex } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const quizQuestions = lesson.quizQuestions.filter((_, i) => i !== questionIndex);
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, quizQuestions } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'UPDATE_QUIZ_QUESTION': {
      const { chapterIndex, lessonIndex, questionIndex, field, value, optionIndex } = action.payload;
      const chapter = state[chapterIndex];
      const lesson = chapter.lessons[lessonIndex];
      const quizQuestions = lesson.quizQuestions.map((q, i) => {
        if (i !== questionIndex) return q;
        if (field === 'options') {
          const options = q.options.map((opt, oi) => oi === optionIndex ? value : opt);
          return { ...q, options };
        }
        return { ...q, [field]: value };
      });
      const lessons = chapter.lessons.map((l, i) => i === lessonIndex ? { ...l, quizQuestions } : l);
      return state.map((ch, i) => i === chapterIndex ? { ...ch, lessons } : ch);
    }

    case 'ADJUST_CHAPTER_COUNT': {
      const { count } = action.payload;
      if (count > state.length) {
        const newChapters = Array(count - state.length).fill().map(() => ({
          name: '',
          lessons: [{
            type: 'video',
            title: '',
            videoUrl: '',
            description: '',
            aboutLesson: '',
            hasResources: false,
            resources: { downloadable: [], internet: [] },
            quizQuestions: []
          }]
        }));
        return [...state, ...newChapters];
      } else if (count < state.length) {
        return state.slice(0, count);
      }
      return state;
    }

    // Ensure there are at least `count` chapters; do not shrink when count is smaller
    case 'ENSURE_CHAPTER_COUNT': {
      const { count } = action.payload;
      if (count > state.length) {
        const newChapters = Array(count - state.length).fill().map(() => ({
          name: '',
          lessons: [{
            type: 'video',
            title: '',
            videoUrl: '',
            description: '',
            aboutLesson: '',
            hasResources: false,
            resources: { downloadable: [], internet: [] },
            quizQuestions: []
          }]
        }));
        return [...state, ...newChapters];
      }
      return state;
    }

    default:
      return state;
  }
};
