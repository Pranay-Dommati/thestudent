/**
 * InputSchemaInferrer - Analyzes Python code to infer input schema and constraints
 * 
 * This module parses Python code (as text) and extracts:
 * - Function/method parameters and their types
 * - Type hints and annotations
 * - Usage patterns that imply constraints
 * - Problem category (array, string, hash map, etc.)
 */

// Problem categories with their default constraints
const PROBLEM_CATEGORIES = {
    // Numeric problems (sum, max, min, etc.)
    numeric: {
        defaultConstraints: {
            integer: { min: -1000, max: 1000 },
            float: { min: -1000.0, max: 1000.0, precision: 2 }
        }
    },
    
    // Array problems (traversal, two-pointer, window, etc.)
    array: {
        defaultConstraints: {
            list_int: { minLen: 1, maxLen: 10, min: -100, max: 100 },
            list_str: { minLen: 1, maxLen: 8, stringMinLen: 1, stringMaxLen: 5 }
        }
    },
    
    // String problems (mapping, frequency, pattern, etc.)
    string: {
        defaultConstraints: {
            string: { minLen: 1, maxLen: 10, charset: 'lowercase' }
        }
    },
    
    // Hash map problems (isomorphic, counting, etc.)
    hashmap: {
        defaultConstraints: {
            string: { minLen: 1, maxLen: 8, charset: 'lowercase' }
        }
    },
    
    // Graph problems
    graph: {
        defaultConstraints: {
            matrix: { minRows: 3, maxRows: 6, minCols: 3, maxCols: 6, min: 0, max: 1 }
        }
    },
    
    // Tree problems
    tree: {
        defaultConstraints: {
            list_int: { minLen: 3, maxLen: 15, min: -100, max: 100 }
        }
    },
    
    // DP problems
    dp: {
        defaultConstraints: {
            list_int: { minLen: 2, maxLen: 10, min: 0, max: 100 },
            integer: { min: 1, max: 100 }
        }
    }
};

// Type hint patterns for regex matching
const TYPE_PATTERNS = {
    // List types
    'List[int]': { type: 'list_int', constraints: {} },
    'list[int]': { type: 'list_int', constraints: {} },
    'List[str]': { type: 'list_str', constraints: {} },
    'list[str]': { type: 'list_str', constraints: {} },
    'List[float]': { type: 'list_float', constraints: {} },
    'list[float]': { type: 'list_float', constraints: {} },
    'List[List[int]]': { type: 'matrix', constraints: {} },
    'list[list[int]]': { type: 'matrix', constraints: {} },
    
    // Primitive types
    'int': { type: 'integer', constraints: {} },
    'str': { type: 'string', constraints: {} },
    'float': { type: 'float', constraints: {} },
    'bool': { type: 'boolean', constraints: {} },
    
    // Optional types
    'Optional[int]': { type: 'integer', constraints: { allowNull: true } },
    'Optional[str]': { type: 'string', constraints: { allowNull: true } }
};

class InputSchemaInferrer {
    constructor() {
        this.code = '';
        this.lines = [];
        this.schema = null;
    }

    /**
     * Main entry point - infer schema from code
     */
    inferSchema(code, metadata = null) {
        this.code = code;
        this.lines = code.split('\n');
        
        // Initialize schema
        this.schema = {
            inputs: {},
            constraints: [],
            category: 'unknown',
            functionName: null,
            className: null
        };
        
        // Use backend metadata if provided
        if (metadata) {
            this.schema.functionName = metadata.functionName;
            this.schema.className = metadata.className;
            
            // Extract inputs from metadata
            if (metadata.inputs && metadata.inputs.length > 0) {
                for (const input of metadata.inputs) {
                    this.schema.inputs[input.variable || input.name] = {
                        type: this._normalizeType(input.type),
                        constraints: {},
                        label: input.label,
                        isParameter: input.isParameter
                    };
                }
            }
        }
        
        // Parse code for additional info
        this._parseCode();
        
        // Infer problem category
        this._inferCategory();
        
        // Apply category defaults
        this._applyDefaultConstraints();
        
        // Infer constraints from code patterns
        this._inferConstraintsFromCode();
        
        return this.schema;
    }

    /**
     * Normalize type strings
     */
    _normalizeType(type) {
        const typeMap = {
            'list_int': 'list_int',
            'list_str': 'list_str',
            'list_float': 'list_float',
            'integer': 'integer',
            'int': 'integer',
            'string': 'string',
            'text': 'string',
            'str': 'string',
            'float': 'float',
            'number': 'float',
            'boolean': 'boolean',
            'bool': 'boolean',
            'any': 'any'
        };
        return typeMap[type?.toLowerCase()] || 'any';
    }

    /**
     * Parse code to extract function/class info and parameters
     */
    _parseCode() {
        // Find class definition
        const classMatch = this.code.match(/class\s+(\w+)[\s\S]*?:/);
        if (classMatch) {
            this.schema.className = this.schema.className || classMatch[1];
        }
        
        // Find function/method definition
        const funcPattern = /def\s+(\w+)\s*\(([\s\S]*?)\)\s*(?:->[\s\S]*?)?:/g;
        let match;
        
        while ((match = funcPattern.exec(this.code)) !== null) {
            const funcName = match[1];
            const params = match[2];
            
            // Skip __init__ and other dunder methods
            if (funcName.startsWith('__')) continue;
            
            this.schema.functionName = this.schema.functionName || funcName;
            
            // Parse parameters
            this._parseParameters(params);
        }
    }

    /**
     * Parse function parameters with type hints
     */
    _parseParameters(paramsString) {
        if (!paramsString.trim()) return;
        
        // Split parameters (handling nested brackets)
        const params = this._splitParameters(paramsString);
        
        for (const param of params) {
            // Skip 'self' parameter
            if (param.trim() === 'self') continue;
            
            // Parse parameter: name: Type = default
            const paramMatch = param.match(/(\w+)\s*(?::\s*([\w\[\],\s]+))?\s*(?:=\s*(.+))?/);
            if (!paramMatch) continue;
            
            const [, name, typeHint, defaultValue] = paramMatch;
            
            // Skip if already defined from metadata
            if (this.schema.inputs[name]) continue;
            
            // Determine type
            let inputType = 'any';
            let constraints = {};
            
            if (typeHint) {
                const cleanType = typeHint.trim();
                for (const [pattern, info] of Object.entries(TYPE_PATTERNS)) {
                    if (cleanType.toLowerCase().includes(pattern.toLowerCase())) {
                        inputType = info.type;
                        constraints = { ...info.constraints };
                        break;
                    }
                }
            }
            
            // Infer from default value
            if (defaultValue && inputType === 'any') {
                inputType = this._inferTypeFromValue(defaultValue.trim());
            }
            
            this.schema.inputs[name] = {
                type: inputType,
                constraints,
                isParameter: true
            };
        }
    }

    /**
     * Split parameters handling nested brackets
     */
    _splitParameters(paramsString) {
        const params = [];
        let current = '';
        let depth = 0;
        
        for (const char of paramsString) {
            if (char === '[' || char === '(') depth++;
            else if (char === ']' || char === ')') depth--;
            else if (char === ',' && depth === 0) {
                params.push(current.trim());
                current = '';
                continue;
            }
            current += char;
        }
        
        if (current.trim()) {
            params.push(current.trim());
        }
        
        return params;
    }

    /**
     * Infer type from a value string
     */
    _inferTypeFromValue(value) {
        if (value === 'True' || value === 'False') return 'boolean';
        if (value === 'None') return 'any';
        if (value.startsWith('[') && value.endsWith(']')) {
            // Check array contents
            if (value.match(/\[[\d,\s-]*\]/)) return 'list_int';
            if (value.match(/\[["'][^"']*["'],/)) return 'list_str';
            return 'list_int';
        }
        if (value.startsWith('{')) return 'dict';
        if (value.startsWith('"') || value.startsWith("'")) return 'string';
        if (value.includes('.')) return 'float';
        if (/^-?\d+$/.test(value)) return 'integer';
        return 'any';
    }

    /**
     * Infer problem category from code patterns
     */
    _inferCategory() {
        const code = this.code.toLowerCase();
        
        // Check for hash map patterns
        if (code.includes('{}') || 
            code.includes('dict(') ||
            code.includes(' in ') && code.includes('[')) {
            this.schema.category = 'hashmap';
            return;
        }
        
        // Check for string manipulation
        const hasStringParams = Object.values(this.schema.inputs)
            .some(i => i.type === 'string');
        if (hasStringParams && (
            code.includes('isomorphic') ||
            code.includes('anagram') ||
            code.includes('palindrome') ||
            code.includes('.lower()') ||
            code.includes('.upper()')
        )) {
            this.schema.category = 'string';
            return;
        }
        
        // Check for array patterns
        const hasArrayParams = Object.values(this.schema.inputs)
            .some(i => i.type.startsWith('list_'));
        if (hasArrayParams) {
            // Two-pointer
            if (code.includes('left') && code.includes('right') ||
                code.includes('while') && code.includes('< len(')) {
                this.schema.category = 'array';
                return;
            }
            
            // Sorting
            if (code.includes('.sort(') || code.includes('sorted(')) {
                this.schema.category = 'array';
                return;
            }
            
            // General array
            this.schema.category = 'array';
            return;
        }
        
        // Check for graph/matrix
        if (code.includes('graph') || code.includes('node') || 
            code.includes('edge') || code.includes('visited')) {
            this.schema.category = 'graph';
            return;
        }
        
        // Check for DP patterns
        if (code.includes('dp[') || code.includes('memo')) {
            this.schema.category = 'dp';
            return;
        }
        
        // Default to numeric
        this.schema.category = 'numeric';
    }

    /**
     * Apply default constraints based on category
     */
    _applyDefaultConstraints() {
        const categoryInfo = PROBLEM_CATEGORIES[this.schema.category];
        if (!categoryInfo) return;
        
        for (const [name, inputInfo] of Object.entries(this.schema.inputs)) {
            const typeDefaults = categoryInfo.defaultConstraints[inputInfo.type];
            if (typeDefaults) {
                inputInfo.constraints = {
                    ...typeDefaults,
                    ...inputInfo.constraints
                };
            }
        }
    }

    /**
     * Infer additional constraints from code patterns
     */
    _inferConstraintsFromCode() {
        const code = this.code;
        
        // Look for length equality constraints
        // Pattern: len(x) == len(y) or len(x) != len(y)
        const lenEqualMatch = code.match(/len\((\w+)\)\s*[!=]=\s*len\((\w+)\)/);
        if (lenEqualMatch) {
            const [, var1, var2] = lenEqualMatch;
            this.schema.constraints.push({
                type: 'length_equal',
                variables: [var1, var2]
            });
        }
        
        // Look for range constraints
        // Pattern: for i in range(len(x))
        const rangeMatch = code.match(/range\(len\((\w+)\)\)/g);
        if (rangeMatch) {
            // Implies non-empty array
            for (const match of rangeMatch) {
                const varMatch = match.match(/len\((\w+)\)/);
                if (varMatch && this.schema.inputs[varMatch[1]]) {
                    this.schema.inputs[varMatch[1]].constraints.minLen = 
                        Math.max(1, this.schema.inputs[varMatch[1]].constraints.minLen || 0);
                }
            }
        }
        
        // Look for zip() - implies equal length
        const zipMatch = code.match(/zip\((\w+),\s*(\w+)\)/);
        if (zipMatch) {
            const [, var1, var2] = zipMatch;
            this.schema.constraints.push({
                type: 'length_equal',
                variables: [var1, var2]
            });
        }
        
        // Look for index access patterns
        // Pattern: x[i] where i might go out of bounds
        const indexMatch = code.match(/(\w+)\[(\w+)\]/g);
        if (indexMatch) {
            // Add minLen constraint for indexed arrays
            for (const match of indexMatch) {
                const varMatch = match.match(/(\w+)\[/);
                if (varMatch && this.schema.inputs[varMatch[1]]) {
                    const input = this.schema.inputs[varMatch[1]];
                    if (input.type.startsWith('list_')) {
                        input.constraints.minLen = Math.max(1, input.constraints.minLen || 0);
                    }
                }
            }
        }
        
        // Look for comparison with specific values
        // Pattern: if x > 0, x >= 1, etc.
        const posMatch = code.match(/(\w+)\s*>\s*0|(\w+)\s*>=\s*1/);
        if (posMatch) {
            const varName = posMatch[1] || posMatch[2];
            if (this.schema.inputs[varName] && this.schema.inputs[varName].type === 'integer') {
                this.schema.inputs[varName].constraints.positive = true;
            }
        }
        
        // Look for sorted array requirement
        if (code.includes('binary search') || 
            code.match(/while\s+\w+\s*<\s*\w+/) && code.includes('mid')) {
            for (const [name, input] of Object.entries(this.schema.inputs)) {
                if (input.type.startsWith('list_')) {
                    input.constraints.sorted = true;
                }
            }
        }
        
        // String-specific: look for character checks
        if (code.includes('.isalpha()') || code.includes('.islower()')) {
            for (const [name, input] of Object.entries(this.schema.inputs)) {
                if (input.type === 'string') {
                    input.constraints.charset = 'lowercase';
                }
            }
        }
    }

    /**
     * Get the inferred schema
     */
    getSchema() {
        return this.schema;
    }
}

export default InputSchemaInferrer;
export { PROBLEM_CATEGORIES, TYPE_PATTERNS };
