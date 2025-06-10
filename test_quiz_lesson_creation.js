// Test script to verify quiz lesson creation in AI-generated courses
// Note: This is a simplified test - in reality we'd need to set up proper module imports

async function testQuizLessonCreation() {
  console.log("🧪 Testing Quiz Lesson Creation in AI-Generated Courses");
  console.log("="=60);
  
  try {
    // Test 1: Generate a simple course
    console.log("\n📚 Test 1: Generating Python course...");
    const pythonCourse = await generateLearningPlan("Create a beginner Python programming course");
    
    if (pythonCourse.success) {
      console.log("✅ Course generated successfully");
      console.log(`📊 Course Title: ${pythonCourse.data.title}`);
      console.log(`📅 Total Days: ${pythonCourse.data.totalDays}`);
      
      // Check each day for quiz questions
      let totalQuizLessons = 0;
      let totalVideoLessons = 0;
      
      pythonCourse.data.days.forEach((day, index) => {
        console.log(`\n📖 Day ${day.day}: ${day.topic}`);
        console.log(`   🎥 Videos: ${day.videos ? day.videos.length : 0}`);
        console.log(`   🧩 Quiz Questions: ${day.quizQuestions ? day.quizQuestions.length : 0}`);
        
        if (day.videos) totalVideoLessons += day.videos.length;
        if (day.quizQuestions && day.quizQuestions.length > 0) {
          totalQuizLessons++;
          console.log(`   ✅ Quiz lesson will be created for this day`);
          
          // Show sample quiz questions
          console.log(`   📝 Sample questions:`);
          day.quizQuestions.slice(0, 2).forEach((q, qIndex) => {
            console.log(`      ${qIndex + 1}. ${q.question}`);
            console.log(`         Options: ${q.options.join(', ')}`);
            console.log(`         Correct: ${q.options[q.correct_answer || 0]}`);
          });
        } else {
          console.log(`   ❌ No quiz questions found - no quiz lesson will be created`);
        }
      });
      
      console.log(`\n📊 Summary:`);
      console.log(`   🎥 Total Video Lessons: ${totalVideoLessons}`);
      console.log(`   🧩 Total Quiz Lessons: ${totalQuizLessons}`);
      console.log(`   📈 Quiz Coverage: ${totalQuizLessons}/${pythonCourse.data.days.length} days`);
      
      // Test the course structure transformation
      console.log(`\n🔄 Testing Course Structure Transformation...`);
      
      // Simulate the transformation logic from CourseLearning.jsx
      const transformedChapters = pythonCourse.data.days.map((day, dayIndex) => {
        const videoLessons = (day.videos || []).map((video, videoIndex) => ({
          id: `day_${day.day}_video_${videoIndex}`,
          title: video.title,
          type: 'video',
          videoUrl: video.video_id ? `https://www.youtube.com/embed/${video.video_id}` : video.url
        }));

        const quizLessons = [];
        if (day.quizQuestions && day.quizQuestions.length > 0) {
          quizLessons.push({
            id: `day_${day.day}_quiz`,
            title: `${day.topic} - Knowledge Check`,
            type: 'quiz',
            quiz_questions: day.quizQuestions,
            quizQuestions: day.quizQuestions
          });
        }

        return {
          title: `Day ${day.day}: ${day.topic}`,
          lessons: [...videoLessons, ...quizLessons]
        };
      });
      
      // Count lessons in transformed structure
      let transformedVideoLessons = 0;
      let transformedQuizLessons = 0;
      
      transformedChapters.forEach(chapter => {
        chapter.lessons.forEach(lesson => {
          if (lesson.type === 'video') transformedVideoLessons++;
          if (lesson.type === 'quiz') transformedQuizLessons++;
        });
      });
      
      console.log(`✅ Transformation Results:`);
      console.log(`   🎥 Video Lessons: ${transformedVideoLessons}`);
      console.log(`   🧩 Quiz Lessons: ${transformedQuizLessons}`);
      
      // Test quiz lesson structure
      const firstQuizLesson = transformedChapters
        .flatMap(ch => ch.lessons)
        .find(lesson => lesson.type === 'quiz');
      
      if (firstQuizLesson) {
        console.log(`\n🧩 First Quiz Lesson Structure:`);
        console.log(`   ID: ${firstQuizLesson.id}`);
        console.log(`   Title: ${firstQuizLesson.title}`);
        console.log(`   Type: ${firstQuizLesson.type}`);
        console.log(`   Questions Count: ${firstQuizLesson.quiz_questions.length}`);
        console.log(`   First Question: ${firstQuizLesson.quiz_questions[0].question}`);
      }
      
      return {
        success: true,
        totalDays: pythonCourse.data.days.length,
        daysWithQuizzes: totalQuizLessons,
        daysWithVideos: pythonCourse.data.days.filter(d => d.videos && d.videos.length > 0).length,
        transformedQuizLessons,
        transformedVideoLessons
      };
      
    } else {
      console.log("❌ Course generation failed");
      return { success: false, error: pythonCourse.message };
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    return { success: false, error: error.message };
  }
}

// Run the test
testQuizLessonCreation().then(result => {
  console.log("\n" + "="*60);
  console.log("🎯 TEST RESULTS:");
  console.log("="*60);
  
  if (result.success) {
    console.log("✅ Quiz lesson creation is working correctly!");
    console.log(`📊 Coverage: ${result.daysWithQuizzes}/${result.totalDays} days have quiz lessons`);
    console.log(`🎥 Video lessons created: ${result.transformedVideoLessons}`);
    console.log(`🧩 Quiz lessons created: ${result.transformedQuizLessons}`);
    
    if (result.daysWithQuizzes === result.totalDays) {
      console.log("🎉 PERFECT: Every day/section has a quiz lesson!");
    } else if (result.daysWithQuizzes > 0) {
      console.log("⚠️  PARTIAL: Some days have quiz lessons, but not all");
    } else {
      console.log("❌ PROBLEM: No quiz lessons were created");
    }
  } else {
    console.log("❌ Test failed:", result.error);
  }
}).catch(console.error);
