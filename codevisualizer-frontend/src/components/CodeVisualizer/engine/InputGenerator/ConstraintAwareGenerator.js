/**
 * ConstraintAwareGenerator - Main input generation orchestrator
 * 
 * This is the main class that:
 * 1. Parses code to infer schema (via InputSchemaInferrer)
 * 2. Generates random values (via RandomValueFactory)
 * 3. Enforces constraints (via ConstraintEnforcer)
 * 4. Validates results
 * 
 * Architecture:
 * ConstraintAwareGenerator
 * ├── InputSchemaInferrer  - Analyzes code, extracts schema
 * ├── RandomValueFactory   - Generates typed random values
 * ├── ConstraintEnforcer   - Validates and adjusts values
 * └── SeedManager         - Ensures reproducibility
 */

import SeedManager from './SeedManager';
import RandomValueFactory from './RandomValueFactory';
import InputSchemaInferrer from './InputSchemaInferrer';
import ConstraintEnforcer from './ConstraintEnforcer';

class ConstraintAwareGenerator {
    constructor(seed = null) {
        this.seedManager = new SeedManager(seed);
        this.valueFactory = new RandomValueFactory(this.seedManager);
        this.schemaInferrer = new InputSchemaInferrer();
        this.constraintEnforcer = new ConstraintEnforcer();
        
        this.maxRetries = 10;
        this.lastSchema = null;
        this.lastGeneratedInputs = null;
    }

    /**
     * Main entry point - generate random inputs for code
     * 
     * @param {string} code - Python code to analyze
     * @param {object} metadata - Optional backend metadata from detect-inputs
     * @returns {object} - { inputs: {name: value}, schema, seed }
     */
    generate(code, metadata = null) {
        // Step 1: Infer schema from code
        const schema = this.schemaInferrer.inferSchema(code, metadata);
        this.lastSchema = schema;
        
        // Step 2: Generate values with retries
        let inputs = null;
        let attempts = 0;
        
        while (attempts < this.maxRetries) {
            // Generate base values
            inputs = this._generateBaseValues(schema);
            
            // Enforce constraints
            inputs = this.constraintEnforcer.enforce(inputs, schema.constraints);
            
            // Validate
            const validation = this.constraintEnforcer.validate(inputs, schema.constraints);
            
            if (validation.valid) {
                break;
            }
            
            attempts++;
            
            // On retry, use a different seed
            this.seedManager.random();
        }
        
        this.lastGeneratedInputs = inputs;
        
        return {
            inputs,
            schema,
            seed: this.seedManager.getSeed(),
            formatted: this._formatInputs(inputs, schema)
        };
    }

    /**
     * Regenerate with a new random seed
     */
    regenerate() {
        this.seedManager.randomize();
        if (this.lastSchema) {
            return this.generate(
                this.schemaInferrer.code,
                null // Don't re-parse metadata
            );
        }
        return null;
    }

    /**
     * Generate with a specific seed (for reproducibility)
     */
    generateWithSeed(code, seed, metadata = null) {
        this.seedManager.setSeed(seed);
        return this.generate(code, metadata);
    }

    /**
     * Generate base values for all inputs
     */
    _generateBaseValues(schema) {
        const inputs = {};
        
        // First pass: generate values for inputs without length dependencies
        const deferredInputs = [];
        
        for (const [name, inputInfo] of Object.entries(schema.inputs)) {
            // Check if this input has a length dependency
            const hasLengthDep = schema.constraints.some(c => 
                c.type === 'length_equal' && 
                c.variables.includes(name) && 
                c.variables[0] !== name
            );
            
            if (hasLengthDep) {
                deferredInputs.push({ name, inputInfo });
            } else {
                inputs[name] = this.valueFactory.generate(
                    inputInfo.type,
                    inputInfo.constraints
                );
            }
        }
        
        // Second pass: generate deferred inputs with known lengths
        for (const { name, inputInfo } of deferredInputs) {
            // Find the constraint and the source variable
            const constraint = schema.constraints.find(c =>
                c.type === 'length_equal' && 
                c.variables.includes(name)
            );
            
            if (constraint) {
                // Find the other variable
                const otherVar = constraint.variables.find(v => v !== name);
                const otherValue = inputs[otherVar];
                
                if (otherValue) {
                    // Use the same length
                    const targetLength = Array.isArray(otherValue) 
                        ? otherValue.length 
                        : (typeof otherValue === 'string' ? otherValue.length : null);
                    
                    if (targetLength !== null) {
                        const adjustedConstraints = {
                            ...inputInfo.constraints,
                            length: targetLength
                        };
                        inputs[name] = this.valueFactory.generate(
                            inputInfo.type,
                            adjustedConstraints
                        );
                        continue;
                    }
                }
            }
            
            // Fallback: generate normally
            inputs[name] = this.valueFactory.generate(
                inputInfo.type,
                inputInfo.constraints
            );
        }
        
        return inputs;
    }

    /**
     * Format inputs for display and API
     */
    _formatInputs(inputs, schema) {
        const formatted = [];
        
        for (const [name, value] of Object.entries(inputs)) {
            const inputInfo = schema.inputs[name];
            
            formatted.push({
                name,
                value,
                type: inputInfo?.type || 'any',
                displayValue: this._formatDisplayValue(value),
                pythonValue: this.valueFactory.formatForPython(value)
            });
        }
        
        return formatted;
    }

    /**
     * Format value for display
     */
    _formatDisplayValue(value) {
        if (value === null || value === undefined) return 'None';
        if (typeof value === 'boolean') return value ? 'True' : 'False';
        if (typeof value === 'string') return `"${value}"`;
        if (Array.isArray(value)) {
            if (value.length > 10) {
                return `[${value.slice(0, 5).join(', ')}, ... (${value.length} items)]`;
            }
            return `[${value.map(v => this._formatDisplayValue(v)).join(', ')}]`;
        }
        if (typeof value === 'object') {
            const entries = Object.entries(value);
            if (entries.length > 5) {
                return `{${entries.slice(0, 3).map(([k, v]) => 
                    `${this._formatDisplayValue(k)}: ${this._formatDisplayValue(v)}`
                ).join(', ')}, ...}`;
            }
            return `{${entries.map(([k, v]) => 
                `${this._formatDisplayValue(k)}: ${this._formatDisplayValue(v)}`
            ).join(', ')}}`;
        }
        return String(value);
    }

    /**
     * Get values in order suitable for function call
     */
    getOrderedValues(schema = null) {
        const s = schema || this.lastSchema;
        if (!s || !this.lastGeneratedInputs) return [];
        
        return Object.keys(s.inputs)
            .filter(name => s.inputs[name].isParameter)
            .map(name => this.lastGeneratedInputs[name]);
    }

    /**
     * Get the last schema
     */
    getSchema() {
        return this.lastSchema;
    }

    /**
     * Get the current seed
     */
    getSeed() {
        return this.seedManager.getSeed();
    }

    /**
     * Set seed for reproducibility
     */
    setSeed(seed) {
        this.seedManager.setSeed(seed);
    }
}

export default ConstraintAwareGenerator;
