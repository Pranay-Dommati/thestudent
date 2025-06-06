// Quick test script to verify lesson navigation
// Run this in browser console to check lesson data

function testLessonNavigation() {
    // Check current lesson state
    console.log('Current lesson data:');
    
    // Get React component state (if available)
    const reactRoot = document.querySelector('#root');
    if (reactRoot && reactRoot._reactInternalFiber) {
        console.log('React state available');
    }
    
    // Check for lesson data in page
    const lessonTitle = document.querySelector('.lesson-title, h1, h2, h3');
    console.log('Lesson title element:', lessonTitle?.textContent);
    
    // Check for video element
    const videoFrame = document.querySelector('iframe');
    console.log('Video iframe:', videoFrame?.src);
    
    // Check for tab elements
    const tabs = document.querySelectorAll('[data-tab], button');
    console.log('Available tabs:', Array.from(tabs).map(t => t.textContent).filter(t => t));
    
    // Check for markdown content
    const markdownContent = document.querySelector('.prose, .markdown-content');
    console.log('Markdown content found:', !!markdownContent);
    
    // Check for quiz content
    const quizContent = document.querySelector('[data-quiz], .quiz');
    console.log('Quiz content found:', !!quizContent);
    
    // Check sidebar lessons
    const sidebarLessons = document.querySelectorAll('.lesson-item, [data-lesson]');
    console.log('Sidebar lessons count:', sidebarLessons.length);
    
    return {
        lessonTitle: lessonTitle?.textContent,
        hasVideo: !!videoFrame,
        videoSrc: videoFrame?.src,
        tabCount: tabs.length,
        hasMarkdown: !!markdownContent,
        hasQuiz: !!quizContent,
        sidebarLessons: sidebarLessons.length
    };
}

// Also provide instructions
console.log('To test lesson navigation:');
console.log('1. Run testLessonNavigation() in console');
console.log('2. Click on different lessons in sidebar');
console.log('3. Check tabs in video lessons (About/Resources)');
console.log('4. Verify quiz and reading lessons display correctly');
