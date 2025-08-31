import { getSchoolCourses } from '../services/courseApi';
import { stateBoards } from '../components/Courses/data/states';

/**
 * Check if courses are available for specific board and class combinations
 * @param {string} classLevel - The class level (e.g., '6th', '7th', etc.)
 * @returns {Promise<Array>} Array of available boards with availability status
 */
export const checkBoardAvailability = async (classLevel) => {
  const boardsToCheck = [
    { 
      id: 'cbse', 
      name: 'CBSE',
      fullName: 'Central Board of Secondary Education',
      available: false
    },
    { 
      id: 'state', 
      name: 'State Board',
      fullName: 'State Board of Secondary and Higher Secondary Education',
      available: false
    }
  ];

  const availableBoards = [];

  try {
    // Check CBSE courses
    const cbseData = await getSchoolCourses(classLevel, 'cbse');
    if (cbseData && cbseData.length > 0) {
      const cbseBoard = boardsToCheck.find(board => board.id === 'cbse');
      availableBoards.push({ ...cbseBoard, available: true });
    }

    // Check State board courses - check for any state
    const stateData = await getSchoolCourses(classLevel, 'state');
    if (stateData && stateData.length > 0) {
      const stateBoard = boardsToCheck.find(board => board.id === 'state');
      availableBoards.push({ ...stateBoard, available: true });
    }
  } catch (error) {
    console.error('Error checking board availability:', error);
    // Fallback: return empty array instead of showing all boards
    return [];
  }

  return availableBoards;
};

/**
 * Check if state board courses are available for specific states
 * @param {string} classLevel - The class level (e.g., '6th', '7th', etc.)
 * @returns {Promise<Array>} Array of available states with course availability
 */
export const checkStateAvailability = async (classLevel) => {
  const availableStates = [];

  try {
    for (const state of stateBoards) {
      const stateValue = state.id === 'ts' ? 'Telangana' : 
                        state.id === 'ap' ? 'Andhra Pradesh' : state.name;
      
      const stateData = await getSchoolCourses(classLevel, 'state', stateValue);
      if (stateData && stateData.length > 0) {
        availableStates.push({
          ...state,
          available: true
        });
      }
    }
  } catch (error) {
    console.error('Error checking state availability:', error);
    // Fallback: return all states if API fails
    return stateBoards.map(state => ({ ...state, available: true }));
  }

  return availableStates;
};
