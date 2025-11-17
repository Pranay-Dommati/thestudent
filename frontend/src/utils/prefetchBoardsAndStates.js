import api from './axios';
import { courseCache } from './courseCache';
import { checkStateAvailability } from './courseAvailability';

const CLASS_LEVELS = ['6th','7th','8th','9th','10th','11th','12th'];

/**
 * Prefetch board availability (CBSE/State) for class levels using tiny payloads (limit=1).
 * If state board is present, prefetch full state availability sequentially to avoid bursts.
 * @param {Array<string>} [levels] Optional class levels to target
 * @param {AbortSignal} [signal] Optional AbortSignal for cancellation
 */
export async function prefetchBoardsAndStates(levels = CLASS_LEVELS, signal) {
  const tasks = [];

  for (const classLevel of levels) {
    // Skip if board availability is fresh in cache
    const boardKey = `board_availability_${classLevel}`;
    if (courseCache.isFresh(boardKey)) continue;

    const cbseReq = api
      .get('/courses/school/', { params: { class: classLevel, board: 'cbse', limit: 1 }, signal })
      .then(({ data }) => Array.isArray(data) ? data.length > 0 : (data?.results?.length || 0) > 0)
      .catch(() => false);

    const stateReq = api
      .get('/courses/school/', { params: { class: classLevel, board: 'state', limit: 1 }, signal })
      .then(({ data }) => Array.isArray(data) ? data.length > 0 : (data?.results?.length || 0) > 0)
      .catch(() => false);

    tasks.push(
      Promise.allSettled([cbseReq, stateReq]).then(async ([cbseRes, stateRes]) => {
        const hasCbse = cbseRes.status === 'fulfilled' && cbseRes.value === true;
        const hasState = stateRes.status === 'fulfilled' && stateRes.value === true;

        const availableBoards = [];
        if (hasCbse) availableBoards.push({ id: 'cbse', name: 'CBSE', fullName: 'Central Board of Secondary Education', available: true });
        if (hasState) availableBoards.push({ id: 'state', name: 'State Board', fullName: 'State Board of Secondary and Higher Secondary Education', available: true });

        if (availableBoards.length) {
          courseCache.setBoardAvailability(classLevel, availableBoards);
        }

        // If state exists and cache isn't fresh, prefetch states sequentially
        if (hasState && !courseCache.isFresh(`state_availability_${classLevel}`)) {
          try {
            await checkStateAvailability(classLevel);
          } catch {}
        }
      })
    );
  }

  // Run board checks in parallel; state lists happen sequentially within each task
  try { await Promise.all(tasks); } catch {}
}

export default prefetchBoardsAndStates;
