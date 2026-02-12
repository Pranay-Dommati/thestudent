/**
 * InputGenerator Module
 * 
 * Constraint-aware random input generation system.
 * 
 * Architecture:
 * ├── ConstraintAwareGenerator - Main orchestrator
 * ├── InputSchemaInferrer      - Code analysis and schema extraction
 * ├── RandomValueFactory       - Typed random value generation
 * ├── ConstraintEnforcer       - Constraint validation and enforcement
 * └── SeedManager              - Reproducibility support
 * 
 * Usage:
 * ```javascript
 * import { ConstraintAwareGenerator } from './InputGenerator';
 * 
 * const generator = new ConstraintAwareGenerator();
 * const result = generator.generate(pythonCode, metadata);
 * // result.inputs = { s: "abc", t: "xyz" }
 * // result.schema = { inputs: {...}, constraints: [...] }
 * // result.seed = 123456
 * ```
 */

import ConstraintAwareGenerator from './ConstraintAwareGenerator';
import InputSchemaInferrer, { PROBLEM_CATEGORIES, TYPE_PATTERNS } from './InputSchemaInferrer';
import RandomValueFactory, { CHARSETS } from './RandomValueFactory';
import ConstraintEnforcer from './ConstraintEnforcer';
import SeedManager from './SeedManager';

export {
    ConstraintAwareGenerator,
    InputSchemaInferrer,
    RandomValueFactory,
    ConstraintEnforcer,
    SeedManager,
    PROBLEM_CATEGORIES,
    TYPE_PATTERNS,
    CHARSETS
};

export default ConstraintAwareGenerator;
