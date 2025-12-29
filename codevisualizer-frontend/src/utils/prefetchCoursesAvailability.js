import api from './axios';
import { courseCache } from './courseCache';

// Minimal descriptor for school levels; avoids storing React components in cache
const SCHOOL_LEVELS = [
  { id: '6th', name: '6th Standard', description: 'Foundation courses for 6th grade students', apiClass: '6th' },
  { id: '7th', name: '7th Standard', description: 'Foundation courses for 7th grade students', apiClass: '7th' },
  { id: '8th', name: '8th Standard', description: 'Foundation courses for 8th grade students', apiClass: '8th' },
  { id: '9th', name: '9th Standard', description: 'Foundation courses for 9th grade students', apiClass: '9th' },
  { id: '10th', name: '10th Standard', description: 'Foundation courses for 10th grade students', apiClass: '10th' },
  { id: '11th', name: '11th Standard', description: 'Advanced courses for 11th grade students', apiClass: '11th' },
  { id: '12th', name: '12th Standard', description: 'Preparation for higher education', apiClass: '12th' },
];

/**
 * Prefetches course availability for /courses and warms level caches.
 * Runs lightweight requests (limit=1) in parallel and stores availability in courseCache.
 * @param {AbortSignal} [signal] Optional AbortSignal to cancel in-flight requests.
 */
export async function prefetchCoursesAvailability(signal) {
  try {
    // Skip if cache is already fresh
    if (courseCache.isFresh('course_availability')) {
      return;
    }

    const promises = SCHOOL_LEVELS.map((level) =>
      api
        .get('/courses/school/', { params: { class: level.apiClass, limit: 1 }, signal })
        .then(({ data }) => ({ level, data, ok: true }))
        .catch(() => ({ level, ok: false }))
    );

    const results = await Promise.allSettled(promises);

    const available = [];
    results.forEach((res) => {
      if (res.status !== 'fulfilled') return;
      const { level, data, ok } = res.value || {};
      if (!ok || !level) return;
      const items = Array.isArray(data) ? data : (data?.results || []);
      if (items && items.length > 0) {
        available.push({ id: level.id, name: level.name, description: level.description, apiClass: level.apiClass });
        // Warm tiny level cache
        courseCache.setCoursesForLevel(level.apiClass, items);
      }
    });

    // Fallback: if detection failed (e.g., API shape unknown), store all levels for optimistic UX
    const finalLevels = available.length > 0 ? available : SCHOOL_LEVELS.map(({ id, name, description, apiClass }) => ({ id, name, description, apiClass }));
    courseCache.setCourseAvailability(finalLevels);
  } catch {
    // Best effort prefetch; ignore errors
  }
}

export default prefetchCoursesAvailability;
