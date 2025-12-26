# ProLearning Features Directory

This directory will contain extracted feature modules as part of the ProLearning page modularization effort.

## Purpose

The main ProLearningPage.jsx component is currently 6,383 lines long. This directory will house self-contained feature modules that are gradually extracted from the main component to improve:

- **Maintainability**: Easier to understand and modify individual features
- **Testability**: Each feature can be tested independently
- **Reusability**: Features can be reused in other components
- **Collaboration**: Multiple developers can work on different features simultaneously

## Planned Feature Modules

### Priority 1 (Week 1) - Quick Wins
- [ ] **VideoFeature.jsx** (~200 lines)
  - Video modal and player logic
  - YouTube ID extraction
  - Video embed handling

- [ ] **ContentSanitization.js** (~300 lines)
  - Markdown sanitization
  - Math content handling
  - Content pre-processing

- [ ] **MarkdownRenderers.jsx** (~400 lines)
  - ReactMarkdown component definitions
  - Code block rendering
  - Syntax highlighting configuration

### Priority 2 (Week 2) - Core Features
- [ ] **TopicManagement.js** (~400 lines)
  - Topic selection and state
  - Topic completion tracking
  - Topic blocking logic

- [ ] **TabNavigation.js** (~300 lines)
  - Tab switching logic
  - URL synchronization
  - Tab availability management

- [ ] **ReadingSections.js** (~250 lines)
  - Reading section parsing
  - Section navigation
  - Progress tracking

### Priority 3 (Week 3) - Complex Features
- [ ] **StorageManagement.js** (~350 lines)
  - Database operations
  - Cache management
  - Content persistence

- [ ] **ContentLoading.js** (~600 lines)
  - Content loading strategies
  - Reload vs first-time logic
  - Loading state management

### Priority 4 (Week 4) - Advanced Features
- [ ] **ProgressiveGeneration.js** (~500 lines)
  - Progressive content generation
  - Generation workflow
  - Tab completion handling

- [ ] **AutoSave.js** (~400 lines)
  - Backend saving
  - Course persistence
  - Save status tracking

## Usage Pattern

Each feature module will export a custom hook that the main component can use:

```javascript
// Example: VideoFeature.jsx
export const useVideoPlayer = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  
  const openVideoModal = (video) => { ... };
  const closeVideoModal = () => { ... };
  
  return {
    isVideoModalOpen,
    currentVideo,
    openVideoModal,
    closeVideoModal,
    VideoPlayerModal
  };
};

export const VideoPlayerModal = ({ ... }) => { ... };
```

```javascript
// Usage in ProLearningPage.jsx
import { useVideoPlayer } from '../features/VideoFeature';

const ProLearningPage = () => {
  const { openVideoModal, VideoPlayerModal } = useVideoPlayer();
  
  // Use video functionality...
};
```

## Guidelines

1. **Self-contained**: Each feature should be independent
2. **Single Responsibility**: One feature, one purpose
3. **Well-tested**: Include tests for each feature
4. **Documented**: Clear JSDoc comments
5. **Backward Compatible**: Don't break existing functionality

## Status

- ✅ Folder structure created
- ✅ ProLearningPage moved to core/
- 🔄 Feature extraction in progress
- ⏳ Waiting to start first extraction (VideoFeature)

## Next Steps

1. Extract VideoFeature module
2. Test thoroughly
3. Continue with next priority feature
4. Update this README as features are completed
