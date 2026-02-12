/**
 * ConstraintEnforcer - Validates and enforces constraints on generated inputs
 * 
 * This module ensures generated inputs satisfy all constraints.
 * It can validate existing inputs and adjust them if needed.
 */

class ConstraintEnforcer {
    constructor() {
        this.maxRetries = 10;
    }

    /**
     * Enforce all constraints on generated inputs
     * Returns adjusted inputs that satisfy constraints
     */
    enforce(inputs, constraints) {
        let adjusted = { ...inputs };
        
        for (const constraint of constraints) {
            switch (constraint.type) {
                case 'length_equal':
                    adjusted = this._enforceLengthEqual(adjusted, constraint);
                    break;
                    
                case 'length_less':
                    adjusted = this._enforceLengthLess(adjusted, constraint);
                    break;
                    
                case 'length_greater':
                    adjusted = this._enforceLengthGreater(adjusted, constraint);
                    break;
                    
                case 'value_less':
                    adjusted = this._enforceValueLess(adjusted, constraint);
                    break;
                    
                case 'value_greater':
                    adjusted = this._enforceValueGreater(adjusted, constraint);
                    break;
                    
                case 'unique':
                    adjusted = this._enforceUnique(adjusted, constraint);
                    break;
                    
                case 'sorted':
                    adjusted = this._enforceSorted(adjusted, constraint);
                    break;
                    
                case 'non_empty':
                    adjusted = this._enforceNonEmpty(adjusted, constraint);
                    break;
                    
                default:
                    // Unknown constraint type, skip
                    console.warn(`Unknown constraint type: ${constraint.type}`);
            }
        }
        
        return adjusted;
    }

    /**
     * Validate that inputs satisfy all constraints
     * Returns { valid: boolean, errors: string[] }
     */
    validate(inputs, constraints) {
        const errors = [];
        
        for (const constraint of constraints) {
            const error = this._checkConstraint(inputs, constraint);
            if (error) {
                errors.push(error);
            }
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Check a single constraint
     */
    _checkConstraint(inputs, constraint) {
        switch (constraint.type) {
            case 'length_equal': {
                const [var1, var2] = constraint.variables;
                const val1 = inputs[var1];
                const val2 = inputs[var2];
                if (val1 && val2) {
                    const len1 = this._getLength(val1);
                    const len2 = this._getLength(val2);
                    if (len1 !== len2) {
                        return `Length of ${var1} (${len1}) must equal length of ${var2} (${len2})`;
                    }
                }
                break;
            }
            
            case 'length_less': {
                const [var1, var2] = constraint.variables;
                const val1 = inputs[var1];
                const val2 = inputs[var2];
                if (val1 && val2) {
                    const len1 = this._getLength(val1);
                    const len2 = this._getLength(val2);
                    if (len1 >= len2) {
                        return `Length of ${var1} must be less than length of ${var2}`;
                    }
                }
                break;
            }
            
            case 'non_empty': {
                const varName = constraint.variable;
                const value = inputs[varName];
                if (value !== undefined && this._getLength(value) === 0) {
                    return `${varName} must not be empty`;
                }
                break;
            }
            
            case 'unique': {
                const varName = constraint.variable;
                const value = inputs[varName];
                if (Array.isArray(value)) {
                    const unique = new Set(value);
                    if (unique.size !== value.length) {
                        return `${varName} must have unique elements`;
                    }
                }
                break;
            }
            
            case 'sorted': {
                const varName = constraint.variable;
                const value = inputs[varName];
                if (Array.isArray(value)) {
                    for (let i = 1; i < value.length; i++) {
                        if (value[i] < value[i - 1]) {
                            return `${varName} must be sorted`;
                        }
                    }
                }
                break;
            }
        }
        
        return null;
    }

    /**
     * Get length of value (array/string)
     */
    _getLength(value) {
        if (Array.isArray(value)) return value.length;
        if (typeof value === 'string') return value.length;
        return 0;
    }

    /**
     * Enforce length equality between two variables
     */
    _enforceLengthEqual(inputs, constraint) {
        const [var1, var2] = constraint.variables;
        const val1 = inputs[var1];
        const val2 = inputs[var2];
        
        if (!val1 || !val2) return inputs;
        
        const len1 = this._getLength(val1);
        const len2 = this._getLength(val2);
        
        if (len1 === len2) return inputs;
        
        // Use the smaller length
        const targetLen = Math.min(len1, len2);
        
        const adjusted = { ...inputs };
        
        // Adjust first value
        if (Array.isArray(val1)) {
            adjusted[var1] = val1.slice(0, targetLen);
        } else if (typeof val1 === 'string') {
            adjusted[var1] = val1.slice(0, targetLen);
        }
        
        // Adjust second value
        if (Array.isArray(val2)) {
            adjusted[var2] = val2.slice(0, targetLen);
        } else if (typeof val2 === 'string') {
            adjusted[var2] = val2.slice(0, targetLen);
        }
        
        return adjusted;
    }

    /**
     * Enforce length less than
     */
    _enforceLengthLess(inputs, constraint) {
        const [var1, var2] = constraint.variables;
        const val1 = inputs[var1];
        const val2 = inputs[var2];
        
        if (!val1 || !val2) return inputs;
        
        const len1 = this._getLength(val1);
        const len2 = this._getLength(val2);
        
        if (len1 < len2) return inputs;
        
        const adjusted = { ...inputs };
        const targetLen = Math.max(1, len2 - 1);
        
        if (Array.isArray(val1)) {
            adjusted[var1] = val1.slice(0, targetLen);
        } else if (typeof val1 === 'string') {
            adjusted[var1] = val1.slice(0, targetLen);
        }
        
        return adjusted;
    }

    /**
     * Enforce length greater than
     */
    _enforceLengthGreater(inputs, constraint) {
        // This is harder - we'd need to extend the array
        // For now, just return as-is (generator should handle this)
        return inputs;
    }

    /**
     * Enforce value less than
     */
    _enforceValueLess(inputs, constraint) {
        const { variable, value: maxVal } = constraint;
        const val = inputs[variable];
        
        if (val === undefined) return inputs;
        
        const adjusted = { ...inputs };
        
        if (typeof val === 'number' && val >= maxVal) {
            adjusted[variable] = maxVal - 1;
        }
        
        return adjusted;
    }

    /**
     * Enforce value greater than
     */
    _enforceValueGreater(inputs, constraint) {
        const { variable, value: minVal } = constraint;
        const val = inputs[variable];
        
        if (val === undefined) return inputs;
        
        const adjusted = { ...inputs };
        
        if (typeof val === 'number' && val <= minVal) {
            adjusted[variable] = minVal + 1;
        }
        
        return adjusted;
    }

    /**
     * Enforce unique values in array
     */
    _enforceUnique(inputs, constraint) {
        const { variable } = constraint;
        const val = inputs[variable];
        
        if (!Array.isArray(val)) return inputs;
        
        const adjusted = { ...inputs };
        adjusted[variable] = [...new Set(val)];
        
        return adjusted;
    }

    /**
     * Enforce sorted array
     */
    _enforceSorted(inputs, constraint) {
        const { variable, descending = false } = constraint;
        const val = inputs[variable];
        
        if (!Array.isArray(val)) return inputs;
        
        const adjusted = { ...inputs };
        adjusted[variable] = [...val].sort((a, b) => 
            descending ? b - a : a - b
        );
        
        return adjusted;
    }

    /**
     * Enforce non-empty value
     */
    _enforceNonEmpty(inputs, constraint) {
        const { variable, defaultValue } = constraint;
        const val = inputs[variable];
        
        if (this._getLength(val) > 0) return inputs;
        
        const adjusted = { ...inputs };
        
        if (defaultValue !== undefined) {
            adjusted[variable] = defaultValue;
        } else if (Array.isArray(val)) {
            adjusted[variable] = [0]; // Default non-empty array
        } else if (typeof val === 'string') {
            adjusted[variable] = 'a'; // Default non-empty string
        }
        
        return adjusted;
    }
}

export default ConstraintEnforcer;
