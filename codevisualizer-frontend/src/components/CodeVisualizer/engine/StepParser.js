/**
 * StepParser - Parse step type and extract metadata
 * 
 * Analyzes code to determine step type and extracts
 * relevant data for visual primitives.
 */

/**
 * Parse step to determine its type and extract metadata
 * @param {Object} step - The step data from tracer
 * @param {Object} variables - Normalized variables
 * @param {number} loopIteration - Pre-calculated loop iteration (optional)
 * @returns {Object} Parsed step with type and meta
 */
export function parseStepType(step, variables, loopIteration = null) {
    const code = step.code?.trim() || '';
    const changedVars = step.changedVars || step.changed_vars || [];
    
    // Array access: target = array[index]
    const arrayAccessMatch = code.match(/(\w+)\s*=\s*(\w+)\[(\d+|\w+)\]/);
    if (arrayAccessMatch) {
        const [, targetVar, sourceArray, indexStr] = arrayAccessMatch;
        const index = isNaN(indexStr) ? variables[indexStr] : parseInt(indexStr);
        const arrayValue = variables[sourceArray];
        const resultValue = Array.isArray(arrayValue) ? arrayValue[index] : variables[targetVar];
        
        return {
            type: 'array_access',
            targetVar,
            sourceArray,
            index,
            arrayValue,
            resultValue
        };
    }
    
    // For loop: for x in iterable
    const forLoopMatch = code.match(/for\s+(\w+)\s+in\s+(\w+)/);
    if (forLoopMatch) {
        const [, loopVar, iterableName] = forLoopMatch;
        const iterableValue = variables[iterableName];
        
        // Use pre-calculated iteration if available, otherwise default to 1
        const iteration = loopIteration || 1;
        
        // Calculate the current value based on iteration and iterable
        let currentValue = variables[loopVar];
        
        // If currentValue is undefined, get it from the iterable based on iteration
        if (currentValue === undefined && Array.isArray(iterableValue)) {
            const idx = iteration - 1; // iteration is 1-based
            if (idx >= 0 && idx < iterableValue.length) {
                currentValue = iterableValue[idx];
            }
        }
        
        console.log('📋 StepParser for-loop:', {
            loopVar, iterableName, iteration, currentValue, 
            iterableValue, loopIteration,
            varFromLocals: variables[loopVar]
        });
        
        return {
            type: 'for_loop',
            loopVar,
            iterableName,
            currentValue,
            iterableValue,
            iteration
        };
    }
    
    // Condition: if/elif x op y
    const conditionMatch = code.match(/(?:if|elif|while)\s+(.+?)\s*([<>=!]+)\s*(.+?):/);
    if (conditionMatch) {
        const [, leftExpr, operator, rightExpr] = conditionMatch;
        
        // Try to resolve values
        const leftVar = leftExpr.trim();
        const rightVar = rightExpr.trim();
        const left = variables[leftVar] !== undefined ? variables[leftVar] : leftVar;
        const right = variables[rightVar] !== undefined ? variables[rightVar] : rightVar;
        
        // Evaluate condition result
        let result = false;
        try {
            const leftNum = typeof left === 'number' ? left : parseFloat(left);
            const rightNum = typeof right === 'number' ? right : parseFloat(right);
            
            switch (operator) {
                case '>': result = leftNum > rightNum; break;
                case '<': result = leftNum < rightNum; break;
                case '>=': result = leftNum >= rightNum; break;
                case '<=': result = leftNum <= rightNum; break;
                case '==': result = left == right; break;
                case '!=': result = left != right; break;
                default: result = false;
            }
        } catch (e) {
            result = false;
        }
        
        return {
            type: 'condition',
            left,
            leftVar,
            right,
            rightVar,
            operator,
            result
        };
    }
    
    // Return statement
    const returnMatch = code.match(/return\s+(.+)/);
    if (returnMatch) {
        const [, expr] = returnMatch;
        const varName = expr.trim();
        const value = variables[varName] !== undefined ? variables[varName] : expr;
        
        return {
            type: 'return',
            expression: expr,
            value
        };
    }
    
    // Simple assignment: x = value or x = expression
    const assignMatch = code.match(/^(\w+)\s*=\s*(.+)$/);
    if (assignMatch && changedVars.length > 0) {
        const [, targetVar, expr] = assignMatch;
        const value = variables[targetVar];
        
        return {
            type: 'assignment',
            targetVar,
            expression: expr,
            value
        };
    }
    
    // Default: generic step
    return {
        type: 'generic',
        code,
        changedVars,
        variables
    };
}

/**
 * Classify step type for UI display
 */
export function classifyStep(step) {
    const parsed = parseStepType(step, step.variables || step.locals || {});
    
    const typeLabels = {
        'array_access': 'Array Access',
        'for_loop': 'Loop Iteration',
        'condition': 'Condition Check',
        'return': 'Return Value',
        'assignment': 'Assignment',
        'generic': 'Execution'
    };
    
    return {
        type: parsed.type,
        label: typeLabels[parsed.type] || 'Step',
        meta: parsed
    };
}
