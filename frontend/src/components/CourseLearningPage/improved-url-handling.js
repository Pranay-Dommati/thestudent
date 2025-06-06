const fetchRegularCourse = async (
  pathParts = pathname ? pathname.split('/').filter(Boolean) : [],
  isLearningPlanIdParam = false
) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

    let apiUrl;
    let isSchoolCourse = false;

    console.log("📍 Processing URL path parts:", pathParts);

    if (pathParts.includes('10th') || pathParts.includes('11th') || pathParts.includes('12th')) {
      isSchoolCourse = true;
      const classLevel = pathParts.find(part => ['10th', '11th', '12th'].includes(part));
      const board = pathParts.find(part => ['cbse', 'state'].includes(part));

      console.log(`🏫 School course detected: Class ${classLevel}, Board: ${board}`);

      if (board === 'state') {
        const stateIndex = pathParts.indexOf('state');
        if (stateIndex !== -1 && stateIndex + 2 < pathParts.length) {
          const stateId = pathParts[stateIndex + 1];
          const subjectId = pathParts[stateIndex + 2];
          apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&state=${stateId}&subject=${subjectId}`;
          console.log(`📚 Fetching state board course with: class=${classLevel}, board=${board}, state=${stateId}, subject=${subjectId}`);
        }
      } else {
        const subjectIndex = pathParts.indexOf(board) + 1;
        if (subjectIndex < pathParts.length) {
          const subjectId = pathParts[subjectIndex];
          apiUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&subject=${subjectId}`;
          console.log(`📚 Fetching school course with: class=${classLevel}, board=${board}, subject=${subjectId}`);

          // Make the API request
          let response = await axiosInstance.get(apiUrl);

          // Check for empty result and try alternative case
          if (Array.isArray(response.data) && response.data.length === 0) {
            console.log(`⚠️ No results found for subject: ${subjectId}, trying alternative case`);
            const altSubject = subjectId.charAt(0).toUpperCase() + subjectId.slice(1);
            console.log(`🔄 Trying with adjusted subject: ${altSubject}`);
            const altUrl = `${API_BASE_URL}/courses/school/?class=${classLevel}&board=${board}&subject=${altSubject}`;
            response = await axiosInstance.get(altUrl);
          }

          return response;
        }
      }
    } else {
      // Engineering course (e.g., /courses/engineering/123/)
      const courseId = pathParts[pathParts.length - 1];
      apiUrl = `${API_BASE_URL}/courses/engineering/${courseId}/`;
      const response = await axiosInstance.get(apiUrl);
      return response;
    }
  } catch (error) {
    console.error("❌ Error fetching course:", error);
    throw error;
  }
};

