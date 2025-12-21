/**
 * StepNormalizer - Single Source of Truth for Animation Data
 * ==========================================================
 * 
 * THIS IS THE KEY ARCHITECTURAL PIECE.
 * 
 * The animation system was broken because:
 * 1. Primitives were reading from multiple sources
 * 2. State was being derived during animation
 * 3. Previous visual state was polluting current animation
 * 
 * THE FIX:
 * - This normalizer pre-processes ALL steps ONCE at initialization
 * - Each step gets a COMPLETE, SELF-CONTAINED data packet
 * - Primitives are PURE FUNCTIONS of this normalized data
 * - NO reading from previous state, NO deriving during animation
 * 
 * Animation Primitive Contract:
 * - INPUT: Normalized step data (this file produces it)
 * - OUTPUT: Visual changes
 * - READS FROM: Only the step data passed to it
 * - READS FROM RENDERER: NEVER
 */

/**
 * Normalize all steps into self-contained animation packets
 * @param {Array} rawSteps - Steps from backend tracer
 * @returns {Array} Normalized steps ready for animation
 */
export function normalizeSteps(rawSteps) {
    if (!Array.isArray(rawSteps) || rawSteps.length === 0) {
        return [];
    }

    // FIRST PASS: Scan all steps to find all arrays
    // This is crucial because arrays (like function params) might not be in every step's variables
    const knownArrays = new Map();
    rawSteps.forEach(step => {
        const vars = normalizeVariables(step);
        Object.entries(vars).forEach(([name, value]) => {
            if (Array.isArray(value) && !knownArrays.has(name)) {
                knownArrays.set(name, [...value]);
            }
        });
    });
    
    console.log('📦 Known arrays from pre-scan:', Object.fromEntries(knownArrays));

    // Track state as we process steps
    const loopCounters = new Map(); // "line:loopVar" -> iteration count
    const variableHistory = new Map(); // varName -> array of values seen
    
    // SECOND PASS: Normalize each step with full array knowledge
    return rawSteps.map((step, index) => {
        const normalized = {
            // Core identity
            index,
            line: step.line || step.lineNumber || step.line_no,
            code: (step.code || '').trim(),
            event: step.event || 'line',
            
            // Variables at this point (normalized)
            variables: normalizeVariables(step),
            changedVars: step.changedVars || step.changed_vars || [],
            
            // Parsed type and metadata (computed once)
            type: null,
            meta: {},
            
            // Explanation (from backend or generated)
            explanation: step.explanation || null
        };

        // Detect step type with knowledge of ALL arrays
        const parsed = detectStepType(normalized, loopCounters, variableHistory, knownArrays);
        normalized.type = parsed.type;
        normalized.meta = parsed.meta;

        // Track variable history
        Object.entries(normalized.variables).forEach(([name, value]) => {
            if (!variableHistory.has(name)) {
                variableHistory.set(name, []);
            }
            variableHistory.get(name).push({ index, value });
        });

        return normalized;
    });
}

/**
 * Normalize variables from various backend formats
 */
function normalizeVariables(step) {
    const raw = step?.variables || step?.locals || {};
    const normalized = {};
    
    for (const [name, data] of Object.entries(raw)) {
        // Skip internal variables
        if (name.startsWith('_') || name === 'self') continue;
        
        // Extract value from {value, type} format or use directly
        if (data && typeof data === 'object' && 'value' in data) {
            normalized[name] = data.value;
        } else {
            normalized[name] = data;
        }
    }
    
    return normalized;
}

/**
 * Detect step type and extract ALL metadata needed for animation
 * This runs ONCE during normalization, not during animation
 * 
 * @param {Object} step - Normalized step
 * @param {Map} loopCounters - Tracks loop iterations
 * @param {Map} variableHistory - Tracks variable values over time
 * @param {Map} knownArrays - ALL arrays found in ANY step (pre-scanned)
 */
function detectStepType(step, loopCounters, variableHistory, knownArrays) {
    const { code, variables, changedVars } = step;
    
    // ============================================
    // FOR LOOP: for x in iterable
    // ============================================
    const forMatch = code.match(/for\s+(\w+)\s+in\s+(\w+)\s*:/);
    if (forMatch) {
        const [, loopVar, iterableName] = forMatch;
        
        // Get iterable from current step OR from known arrays
        let iterableValue = variables[iterableName];
        if (!Array.isArray(iterableValue) && knownArrays.has(iterableName)) {
            iterableValue = knownArrays.get(iterableName);
        }
        
        // Calculate iteration number based on how many times we've seen this for-loop
        const loopKey = `${step.line}:${loopVar}`;
        const iteration = (loopCounters.get(loopKey) || 0) + 1;
        loopCounters.set(loopKey, iteration);
        
        // ALWAYS derive currentValue from iteration count and iterable
        // Don't trust variables[loopVar] because it might have stale value from previous iteration
        let currentValue;
        if (Array.isArray(iterableValue)) {
            const idx = iteration - 1;
            if (idx >= 0 && idx < iterableValue.length) {
                currentValue = iterableValue[idx];
            }
        }
        
        // Fallback to variables only if we couldn't derive from iterable
        if (currentValue === undefined) {
            currentValue = variables[loopVar];
        }
        
        console.log('🔄 For loop detected:', { 
            loopVar, iterableName, iteration, currentValue, 
            iterableValue, loopKey,
            varFromLocals: variables[loopVar]
        });
        
        return {
            type: 'for_loop',
            meta: {
                loopVar,
                iterableName,
                iterableValue: Array.isArray(iterableValue) ? [...iterableValue] : iterableValue,
                currentValue,
                iteration,
                arrayIndex: iteration - 1,
                isFirstIteration: iteration === 1,
                isLastIteration: Array.isArray(iterableValue) && iteration >= iterableValue.length
            }
        };
    }
    
    // ============================================
    // CONDITION: if/elif x op y
    // ============================================
    const condMatch = code.match(/(?:if|elif|while)\s+(.+?)\s*([<>=!]+)\s*(.+?)\s*:/);
    if (condMatch) {
        const [, leftExpr, operator, rightExpr] = condMatch;
        
        const leftVar = leftExpr.trim();
        const rightVar = rightExpr.trim();
        
        // Resolve values
        let left = variables[leftVar];
        if (left === undefined) left = parseFloat(leftVar) || leftVar;
        
        let right = variables[rightVar];
        if (right === undefined) right = parseFloat(rightVar) || rightVar;
        
        // Evaluate condition
        let result = false;
        try {
            const l = typeof left === 'number' ? left : parseFloat(left);
            const r = typeof right === 'number' ? right : parseFloat(right);
            
            switch (operator) {
                case '>': result = l > r; break;
                case '<': result = l < r; break;
                case '>=': result = l >= r; break;
                case '<=': result = l <= r; break;
                case '==': result = left == right; break;
                case '!=': result = left != right; break;
                default: result = false;
            }
        } catch (e) {
            result = false;
        }
        
        return {
            type: 'condition',
            meta: {
                leftVar,
                rightVar,
                left,
                right,
                operator,
                result,
                expression: `${left} ${operator} ${right}`
            }
        };
    }
    
    // ============================================
    // RETURN: return value
    // ============================================
    const returnMatch = code.match(/return\s+(.+)/);
    if (returnMatch) {
        const expr = returnMatch[1].trim();
        const value = variables[expr] !== undefined ? variables[expr] : expr;
        
        return {
            type: 'return',
            meta: {
                expression: expr,
                value
            }
        };
    }
    
    // ============================================
    // ARRAY ACCESS: x = arr[i]
    // ============================================
    const arrayAccessMatch = code.match(/(\w+)\s*=\s*(\w+)\[(\d+|\w+)\]/);
    if (arrayAccessMatch) {
        const [, targetVar, arrayName, indexExpr] = arrayAccessMatch;
        
        // Get array from current step OR from known arrays
        let arrayValue = variables[arrayName];
        if (!Array.isArray(arrayValue) && knownArrays.has(arrayName)) {
            arrayValue = knownArrays.get(arrayName);
        }
        
        // Resolve index (could be a number or a variable name)
        const index = isNaN(indexExpr) ? (variables[indexExpr] ?? parseInt(indexExpr)) : parseInt(indexExpr);
        
        // Get value from array - this is now reliable because we have knownArrays
        let value;
        if (Array.isArray(arrayValue) && index >= 0 && index < arrayValue.length) {
            value = arrayValue[index];
        } else {
            // Fallback to target variable if already set
            value = variables[targetVar];
        }
        
        console.log('🔍 Array access detected:', { targetVar, arrayName, index, arrayValue, value });
        
        return {
            type: 'array_access',
            meta: {
                targetVar,
                arrayName,
                arrayValue: Array.isArray(arrayValue) ? [...arrayValue] : arrayValue,
                index,
                value
            }
        };
    }
    
    // ============================================
    // ASSIGNMENT: x = value or x = otherVar
    // CHOREOGRAPHY: If expression is another variable, include sourceVar
    // ============================================
    const assignMatch = code.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch) {
        const [, targetVar, expression] = assignMatch;
        const exprTrimmed = expression.trim();
        
        // Determine if expression is a variable (for choreography)
        let sourceVar = null;
        let value;
        
        // Check if expression is a known variable name
        if (variables[exprTrimmed] !== undefined) {
            sourceVar = exprTrimmed;  // For choreography!
            value = variables[exprTrimmed];
        }
        // Check if target already has the value
        else if (variables[targetVar] !== undefined) {
            value = variables[targetVar];
        }
        // Try parsing as number
        else if (!isNaN(exprTrimmed)) {
            value = parseFloat(exprTrimmed);
        }
        // Keep as string expression
        else {
            value = exprTrimmed;
        }
        
        console.log('📝 Assignment detected:', { 
            targetVar, 
            expression: exprTrimmed, 
            sourceVar,
            value, 
            fromTarget: variables[targetVar], 
            fromExpr: variables[exprTrimmed]
        });
        
        return {
            type: 'assignment',
            meta: {
                targetVar,
                expression: exprTrimmed,
                sourceVar,  // For choreography: move source toward target
                value
            }
        };
    }
    
    // ============================================
    // GENERIC: Unknown step type
    // ============================================
    return {
        type: 'generic',
        meta: {
            description: code
        }
    };
}
export function extractArraysFromSteps(normalizedSteps) {
    const arrays = new Map();
    
    normalizedSteps.forEach(step => {
        Object.entries(step.variables).forEach(([name, value]) => {
            if (Array.isArray(value) && !arrays.has(name)) {
                arrays.set(name, [...value]);
            }
        });
    });
    
    return arrays;
}

/**
 * Get scalar variables that will be created during execution
 */
export function extractScalarVariables(normalizedSteps) {
    const scalars = new Set();
    
    normalizedSteps.forEach(step => {
        step.changedVars.forEach(name => {
            const value = step.variables[name];
            if (!Array.isArray(value)) {
                scalars.add(name);
            }
        });
    });
    
    return scalars;
}
