/**
 * RandomValueFactory - Generates random values by type with constraints
 * 
 * This is the core value generation engine. Each type has configurable
 * constraints and produces valid random values.
 */

import SeedManager from './SeedManager';

// Common character sets
const CHARSETS = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    letters: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    digits: '0123456789',
    alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    printable: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?'
};

class RandomValueFactory {
    constructor(seedManager = null) {
        this.seed = seedManager || new SeedManager();
    }

    /**
     * Generate value based on type and constraints
     */
    generate(type, constraints = {}) {
        switch (type) {
            case 'integer':
            case 'int':
                return this.generateInteger(constraints);
            
            case 'float':
            case 'number':
                return this.generateFloat(constraints);
            
            case 'string':
            case 'text':
            case 'str':
                return this.generateString(constraints);
            
            case 'boolean':
            case 'bool':
                return this.generateBoolean(constraints);
            
            case 'list_int':
            case 'array_int':
                return this.generateIntArray(constraints);
            
            case 'list_str':
            case 'array_str':
                return this.generateStringArray(constraints);
            
            case 'list_float':
            case 'array_float':
                return this.generateFloatArray(constraints);
            
            case 'matrix':
            case 'list_list_int':
                return this.generateMatrix(constraints);
            
            case 'dict':
            case 'object':
                return this.generateDict(constraints);
            
            case 'tuple':
                return this.generateTuple(constraints);
            
            case 'set':
                return this.generateSet(constraints);
            
            default:
                return this.generateAny(constraints);
        }
    }

    /**
     * Generate random integer
     */
    generateInteger(constraints = {}) {
        const { min = -100, max = 100, positive = false, negative = false, nonZero = false } = constraints;
        
        let minVal = min;
        let maxVal = max;
        
        if (positive) minVal = Math.max(1, minVal);
        if (negative) maxVal = Math.min(-1, maxVal);
        
        let value;
        let attempts = 0;
        do {
            value = this.seed.randomInt(minVal, maxVal);
            attempts++;
        } while (nonZero && value === 0 && attempts < 10);
        
        return value;
    }

    /**
     * Generate random float
     */
    generateFloat(constraints = {}) {
        const { min = -100.0, max = 100.0, precision = 2 } = constraints;
        const value = this.seed.randomFloat(min, max);
        return parseFloat(value.toFixed(precision));
    }

    /**
     * Generate random string
     */
    generateString(constraints = {}) {
        const {
            minLen = 1,
            maxLen = 10,
            length = null,
            charset = 'lowercase',
            allowEmpty = false,
            pattern = null
        } = constraints;
        
        // Use exact length if provided
        const len = length !== null 
            ? length 
            : this.seed.randomInt(allowEmpty ? 0 : Math.max(1, minLen), maxLen);
        
        if (len === 0) return '';
        
        // Get character set
        const chars = CHARSETS[charset] || charset;
        
        return this.seed.randomString(len, chars);
    }

    /**
     * Generate random boolean
     */
    generateBoolean(constraints = {}) {
        const { probability = 0.5 } = constraints;
        return this.seed.randomBool(probability);
    }

    /**
     * Generate array of integers
     */
    generateIntArray(constraints = {}) {
        const {
            minLen = 1,
            maxLen = 10,
            length = null,
            min = -100,
            max = 100,
            sorted = false,
            unique = false,
            allowEmpty = false,
            positive = false
        } = constraints;
        
        const len = length !== null 
            ? length 
            : this.seed.randomInt(allowEmpty ? 0 : Math.max(1, minLen), maxLen);
        
        if (len === 0) return [];
        
        const elementConstraints = { min, max, positive };
        const result = [];
        const seen = new Set();
        
        for (let i = 0; i < len; i++) {
            let value;
            let attempts = 0;
            
            do {
                value = this.generateInteger(elementConstraints);
                attempts++;
            } while (unique && seen.has(value) && attempts < 100);
            
            if (unique) seen.add(value);
            result.push(value);
        }
        
        if (sorted) {
            result.sort((a, b) => a - b);
        }
        
        return result;
    }

    /**
     * Generate array of strings
     */
    generateStringArray(constraints = {}) {
        const {
            minLen = 1,
            maxLen = 5,
            length = null,
            stringMinLen = 1,
            stringMaxLen = 8,
            charset = 'lowercase',
            allowEmpty = false,
            unique = false
        } = constraints;
        
        const len = length !== null 
            ? length 
            : this.seed.randomInt(allowEmpty ? 0 : Math.max(1, minLen), maxLen);
        
        if (len === 0) return [];
        
        const stringConstraints = { minLen: stringMinLen, maxLen: stringMaxLen, charset };
        const result = [];
        const seen = new Set();
        
        for (let i = 0; i < len; i++) {
            let value;
            let attempts = 0;
            
            do {
                value = this.generateString(stringConstraints);
                attempts++;
            } while (unique && seen.has(value) && attempts < 100);
            
            if (unique) seen.add(value);
            result.push(value);
        }
        
        return result;
    }

    /**
     * Generate array of floats
     */
    generateFloatArray(constraints = {}) {
        const {
            minLen = 1,
            maxLen = 10,
            length = null,
            min = -100.0,
            max = 100.0,
            precision = 2,
            allowEmpty = false
        } = constraints;
        
        const len = length !== null 
            ? length 
            : this.seed.randomInt(allowEmpty ? 0 : Math.max(1, minLen), maxLen);
        
        if (len === 0) return [];
        
        const result = [];
        for (let i = 0; i < len; i++) {
            result.push(this.generateFloat({ min, max, precision }));
        }
        
        return result;
    }

    /**
     * Generate 2D matrix of integers
     */
    generateMatrix(constraints = {}) {
        const {
            rows = null,
            cols = null,
            minRows = 2,
            maxRows = 5,
            minCols = 2,
            maxCols = 5,
            min = -10,
            max = 10,
            square = false
        } = constraints;
        
        const numRows = rows !== null ? rows : this.seed.randomInt(minRows, maxRows);
        const numCols = square 
            ? numRows 
            : (cols !== null ? cols : this.seed.randomInt(minCols, maxCols));
        
        const matrix = [];
        for (let i = 0; i < numRows; i++) {
            const row = [];
            for (let j = 0; j < numCols; j++) {
                row.push(this.generateInteger({ min, max }));
            }
            matrix.push(row);
        }
        
        return matrix;
    }

    /**
     * Generate dictionary/object
     */
    generateDict(constraints = {}) {
        const {
            keys = null,
            valueType = 'integer',
            minLen = 1,
            maxLen = 5,
            keyType = 'string'
        } = constraints;
        
        const result = {};
        
        if (keys) {
            // Use provided keys
            for (const key of keys) {
                result[key] = this.generate(valueType);
            }
        } else {
            // Generate random keys
            const len = this.seed.randomInt(minLen, maxLen);
            for (let i = 0; i < len; i++) {
                const key = keyType === 'string' 
                    ? this.generateString({ minLen: 2, maxLen: 6 })
                    : this.generateInteger({ min: 0, max: 100 });
                result[key] = this.generate(valueType);
            }
        }
        
        return result;
    }

    /**
     * Generate tuple (as array with fixed structure)
     */
    generateTuple(constraints = {}) {
        const { types = ['integer', 'integer'] } = constraints;
        return types.map(type => this.generate(type));
    }

    /**
     * Generate set (unique values)
     */
    generateSet(constraints = {}) {
        const {
            type = 'integer',
            minLen = 1,
            maxLen = 8
        } = constraints;
        
        const len = this.seed.randomInt(minLen, maxLen);
        const elementConstraints = { unique: true, minLen: len, maxLen: len };
        
        if (type === 'integer') {
            return [...new Set(this.generateIntArray(elementConstraints))];
        } else {
            return [...new Set(this.generateStringArray(elementConstraints))];
        }
    }

    /**
     * Generate any type (fallback)
     */
    generateAny(constraints = {}) {
        // Default to a simple integer
        return this.generateInteger(constraints);
    }

    /**
     * Format value for Python code
     */
    formatForPython(value) {
        if (value === null || value === undefined) {
            return 'None';
        }
        if (typeof value === 'boolean') {
            return value ? 'True' : 'False';
        }
        if (typeof value === 'string') {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            return '[' + value.map(v => this.formatForPython(v)).join(', ') + ']';
        }
        if (typeof value === 'object') {
            const pairs = Object.entries(value)
                .map(([k, v]) => `${this.formatForPython(k)}: ${this.formatForPython(v)}`);
            return '{' + pairs.join(', ') + '}';
        }
        return String(value);
    }
}

export default RandomValueFactory;
export { CHARSETS };
