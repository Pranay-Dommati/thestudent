/**
 * SeedManager - Manages random seed for reproducibility
 * 
 * Ensures same seed produces same random values for debugging and replay.
 */

class SeedManager {
    constructor(seed = null) {
        this.seed = seed !== null ? seed : Date.now();
        this.originalSeed = this.seed;
    }

    /**
     * Set a specific seed for reproducibility
     */
    setSeed(seed) {
        this.seed = seed;
        this.originalSeed = seed;
    }

    /**
     * Reset to original seed
     */
    reset() {
        this.seed = this.originalSeed;
    }

    /**
     * Generate a random seed
     */
    randomize() {
        this.seed = Date.now();
        this.originalSeed = this.seed;
        return this.seed;
    }

    /**
     * Get current seed for debugging
     */
    getSeed() {
        return this.seed;
    }

    /**
     * Seeded random number generator (Mulberry32)
     * Fast, simple, and produces good distribution
     */
    random() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    /**
     * Random integer in range [min, max] (inclusive)
     */
    randomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    /**
     * Random float in range [min, max]
     */
    randomFloat(min, max) {
        return this.random() * (max - min) + min;
    }

    /**
     * Random boolean with optional probability
     */
    randomBool(probability = 0.5) {
        return this.random() < probability;
    }

    /**
     * Pick random element from array
     */
    randomChoice(array) {
        if (!array || array.length === 0) return null;
        return array[this.randomInt(0, array.length - 1)];
    }

    /**
     * Shuffle array in place (Fisher-Yates)
     */
    shuffle(array) {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = this.randomInt(0, i);
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    /**
     * Generate random string of given length from charset
     */
    randomString(length, charset = 'abcdefghijklmnopqrstuvwxyz') {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += charset[this.randomInt(0, charset.length - 1)];
        }
        return result;
    }
}

export default SeedManager;
