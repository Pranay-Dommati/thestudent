# ProLearning Core Module

This directory contains the main ProLearningPage component.

## Current Status

- **File**: ProLearningPage.jsx
- **Lines**: 6,383 lines
- **Status**: Monolithic component being modularized

## What's Here

### ProLearningPage.jsx
The main orchestrator component for the Pro Learning experience. This component:
- Manages overall layout and structure
- Composes feature modules together
- Handles routing and navigation
- Provides context to child components

## Modularization in Progress

Features are being gradually extracted from this component into `../features/` directory. As features are extracted, this component will become:
- Cleaner and more focused
- Easier to understand
- Simpler to maintain
- More composable

### Target Structure

After modularization, ProLearningPage.jsx will be reduced to ~2,000 lines and will primarily:
1. Import and compose feature modules
2. Manage top-level routing
3. Provide layout structure
4. Handle global state (via Context if needed)

### Example of Future Structure

```javascript
// After modularization
import { useVideoPlayer } from '../features/VideoFeature';
import { useTopicManagement } from '../features/TopicManagement';
import { useContentLoading } from '../features/ContentLoading';
// ... other features

const ProLearningPage = () => {
  // Feature hooks
  const videoPlayer = useVideoPlayer();
  const topicManager = useTopicManagement();
  const contentLoader = useContentLoading();
  
  // Simple composition and layout
  return (
    <div>
      <Navbar />
      <MainContent {...contentLoader} />
      <Sidebar {...topicManager} />
      {videoPlayer.VideoPlayerModal}
    </div>
  );
};
```

## Import Paths

This component can be imported in several ways:

```javascript
// From App.jsx (recommended - uses index.js)
import ProLearningPage from './components/ProLearning';

// Direct import (also works)
import ProLearningPage from './components/ProLearning/core';

// Explicit path (works but verbose)
import ProLearningPage from './components/ProLearning/core/ProLearningPage';
```

All paths are maintained for backward compatibility.

## Related Files

- `../ProLearningLogic.js` - Content generation logic
- `../ProLearningMobile.jsx` - Mobile-specific rendering
- `../ProBatchGenerator.js` - Batch content generation
- `../ProgressiveContentGenerator.js` - Progressive generation
- `../services/` - Utility services
- `../features/` - Extracted feature modules (coming soon)
