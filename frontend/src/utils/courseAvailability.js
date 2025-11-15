import { getSchoolCourses } from '../services/courseApi';
import { stateBoards } from '../components/Courses/data/states';
import logger from './logger';
import courseCache from './courseCache';

/**
 * Check if courses are available for specific board and class combinations
 * @param {string} classLevel - The class level (e.g., '6th', '7th', etc.)
 * @returns {Promise<Array>} Array of available boards with availability status
 */
export const checkBoardAvailability = async (classLevel) => {
  // Try cache first for quick response
  const cached = courseCache.getBoardAvailability(classLevel);
  if (cached && Array.isArray(cached) && cached.length) {
    logger.log(`Using cached board availability for ${classLevel}`);
    return cached;
  }

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
    logger.error('Error checking board availability:', error);
    // Fallback: return empty array instead of showing all boards
    return [];
  }

  // Cache for next time
  if (availableBoards.length) {
    courseCache.setBoardAvailability(classLevel, availableBoards);
  }

  return availableBoards;
};

/**
 * Check if state board courses are available for specific states
 * @param {string} classLevel - The class level (e.g., '6th', '7th', etc.)
 * @returns {Promise<Array>} Array of available states with course availability
 */
export const checkStateAvailability = async (classLevel) => {
  try {
    // Fast path: return from cache if present
    const cached = courseCache.getStateAvailability(classLevel);
    if (cached && Array.isArray(cached) && cached.length) {
      logger.log(`Using cached state availability for ${classLevel}`);
      return cached;
    }

    // Fetch all state-board courses for this class in ONE request
    const stateCourses = await getSchoolCourses(classLevel, 'state');

    // Build a set of normalized state names present in the data
    const availableNames = new Set(
      (stateCourses || [])
        .map(c => (c.state || '').trim())
        .filter(Boolean)
    );

    // Map state names to our stateBoards list
    const availableStates = stateBoards
      .filter(sb => availableNames.has(sb.name))
      .map(sb => ({ ...sb, available: true }));

    // Cache for subsequent navigations
    if (availableStates.length) {
      courseCache.setStateAvailability(classLevel, availableStates);
    }

    return availableStates;
  } catch (error) {
    logger.error('Error checking state availability:', error);
    // Fallback: return all states if API fails
    return stateBoards.map(state => ({ ...state, available: true }));
  }
};
