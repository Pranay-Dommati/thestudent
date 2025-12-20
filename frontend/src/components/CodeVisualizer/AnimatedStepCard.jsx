import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AnimatedStepCard - Cinematic visualization of each execution step
 * 
 * Provides animated visualizations for:
 * - Array access (nums[0] -> value)
 * - Variable assignments (x = value)
 * - Comparisons (a > b -> True/False)
 * - Loop iterations (for n in nums)
 * - Return statements
 */

const AnimatedStepCard = ({ 
    step, 
    stepIndex, 
    isLatest,
    onAnimationComplete 
}) => {
    const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'playing', 'complete'
    const [showReplay, setShowReplay] = useState(false);
    const animationRef = useRef(null);
    const hasPlayedRef = useRef(false);
    const runIdRef = useRef(0);
    const animationCompletedRef = useRef(false);

    const getVarValue = useCallback((varName) => {
        if (!varName) return undefined;
        const data = step.variables?.[varName];
        if (data && typeof data === 'object' && 'value' in data) return data.value;
        return undefined;
    }, [step.variables]);

    // Parse the step to determine animation type
    const parseStepType = useCallback(() => {
        const code = step.code?.trim() || '';
        const variables = step.variables || {};
        
        const coerceIndex = (raw) => {
            if (raw === undefined || raw === null) return 0;
            if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
            const parsed = parseInt(String(raw), 10);
            return Number.isFinite(parsed) ? parsed : 0;
        };

        // Array/List access assignment: var = list[index]
        const arrayAccessMatch = code.match(/^(\w+)\s*=\s*(\w+)\[(\d+|[\w]+)\]/);
        if (arrayAccessMatch) {
            const [, targetVar, sourceArray, index] = arrayAccessMatch;
            const arrayValue = variables[sourceArray]?.value;
            const indexNum = coerceIndex(/^[0-9]+$/.test(index) ? index : variables[index]?.value);

            const safeArray = Array.isArray(arrayValue) ? arrayValue : [];
            // IMPORTANT: tracer locals are captured BEFORE executing the line.
            // So targetVar often won't exist yet. Compute result from the RHS.
            const computedResult = safeArray[indexNum];
            const targetValue = variables[targetVar]?.value ?? computedResult;

            return {
                type: 'array_access',
                targetVar,
                sourceArray,
                index: indexNum,
                arrayValue: safeArray,
                resultValue: targetValue
            };
        }

        // For loop: for var in iterable
        const forLoopMatch = code.match(/^for\s+(\w+)\s+in\s+(\w+)/);
        if (forLoopMatch) {
            const [, loopVar, iterable] = forLoopMatch;
            const iterableValue = variables[iterable]?.value;
            const currentValue = variables[loopVar]?.value;
            return {
                type: 'for_loop',
                loopVar,
                iterable,
                iterableValue: Array.isArray(iterableValue) ? iterableValue : [],
                currentValue
            };
        }

        // Condition: if/elif var op var
        const conditionMatch = code.match(/^(if|elif)\s+(.+):/);
        if (conditionMatch) {
            const [, keyword, condition] = conditionMatch;
            // Parse comparison: a > b, a == b, etc.
            const compMatch = condition.match(/(\w+)\s*([><=!]+)\s*(\w+)/);
            if (compMatch) {
                const [, leftVar, operator, rightVar] = compMatch;
                const leftValue = variables[leftVar]?.value ?? leftVar;
                const rightValue = variables[rightVar]?.value ?? rightVar;
                // Evaluate the condition
                let result = false;
                try {
                    if (operator === '>') result = leftValue > rightValue;
                    else if (operator === '<') result = leftValue < rightValue;
                    else if (operator === '>=') result = leftValue >= rightValue;
                    else if (operator === '<=') result = leftValue <= rightValue;
                    else if (operator === '==' || operator === '===') result = leftValue === rightValue;
                    else if (operator === '!=' || operator === '!==') result = leftValue !== rightValue;
                } catch (e) { }
                return {
                    type: 'condition',
                    keyword,
                    condition,
                    leftVar,
                    rightVar,
                    leftValue,
                    rightValue,
                    operator,
                    result
                };
            }
            return { type: 'condition', keyword, condition, result: null };
        }

        // Simple assignment: var = expression
        const assignMatch = code.match(/^(\w+)\s*=\s*(.+)$/);
        if (assignMatch && !code.includes('==')) {
            const [, targetVar, expression] = assignMatch;
            const targetValue = variables[targetVar]?.value;
            // Check if it's assigning from another variable
            const sourceVar = expression.trim();
            const sourceValue = variables[sourceVar]?.value;

            // If tracer captured locals before assignment, compute from source variable when possible
            const computedTargetValue = (targetValue !== undefined)
                ? targetValue
                : (sourceValue !== undefined ? sourceValue : undefined);

            return {
                type: 'assignment',
                targetVar,
                expression,
                targetValue: computedTargetValue,
                sourceVar: sourceValue !== undefined ? sourceVar : null,
                sourceValue
            };
        }

        // Return statement
        const returnMatch = code.match(/^return\s+(.+)/);
        if (returnMatch) {
            const [, returnExpr] = returnMatch;
            const returnValue = variables[returnExpr.trim()]?.value ?? returnExpr;
            return {
                type: 'return',
                expression: returnExpr,
                value: returnValue
            };
        }

        return { type: 'generic', code };
    }, [step]);

    const stepType = parseStepType();

    // Auto-play animation ONCE when step first appears as latest
    // After animation completes, showReplay stays true forever (for this step instance)
    useEffect(() => {
        // Only trigger on first time this step becomes latest
        if (!isLatest) return;
        if (hasPlayedRef.current) return;

        hasPlayedRef.current = true;
        animationCompletedRef.current = false;
        runIdRef.current += 1;
        const myRunId = runIdRef.current;

        setAnimationPhase('playing');

        // Animation duration based on type
        const duration = stepType.type === 'array_access' ? 2500 : 
                        stepType.type === 'condition' ? 2000 : 
                        stepType.type === 'for_loop' ? 2000 : 1500;

        if (animationRef.current) clearTimeout(animationRef.current);
        animationRef.current = setTimeout(() => {
            // Guard against stale timers
            if (runIdRef.current !== myRunId) return;
            animationCompletedRef.current = true;
            setAnimationPhase('complete');
            setShowReplay(true);
            onAnimationComplete?.();
        }, duration);

        // Cleanup only clears timer, never resets showReplay/animationPhase after completion
        return () => {
            if (animationRef.current && !animationCompletedRef.current) {
                clearTimeout(animationRef.current);
                animationRef.current = null;
                // Only reset if we're in StrictMode's double-mount scenario
                // (animation not yet completed means this is the first mount being cleaned up)
                hasPlayedRef.current = false;
            }
        };
    }, [isLatest, stepType.type, onAnimationComplete]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
    }, []);

    const handleReplay = () => {
        if (animationRef.current) clearTimeout(animationRef.current);
        setAnimationPhase('playing');
        setShowReplay(false);
        
        const duration = stepType.type === 'array_access' ? 4000 : 
                        stepType.type === 'condition' ? 2500 : 
                        stepType.type === 'for_loop' ? 2500 : 1800;
        
        animationRef.current = setTimeout(() => {
            setAnimationPhase('complete');
            setShowReplay(true);
        }, duration);
    };

    // Render array access animation - Cinematic version
    const renderArrayAccessAnimation = () => {
        const { targetVar, sourceArray, index, arrayValue, resultValue } = stepType;
        const isPlaying = animationPhase === 'playing';
        const isComplete = animationPhase === 'complete';

        // Animation timeline (in seconds):
        // 0.0 - 0.3: Show array label
        // 0.3 - 0.8: Reveal array elements one by one
        // 0.8 - 1.2: Show index labels below elements
        // 1.2 - 1.6: Highlight the accessed index with pointer
        // 1.6 - 2.2: Arrow appears and value "lifts" from array
        // 2.2 - 2.8: Value travels down
        // 2.8 - 3.4: Value lands in target variable
        // 3.4 - 4.0: Success checkmark

        return (
            <div className="relative p-6 bg-slate-900/60 rounded-xl overflow-hidden min-h-[280px]">
                {/* Step 1: Array Label */}
                <motion.div 
                    className="flex items-center gap-2 mb-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <span className="text-sm font-mono text-purple-400 font-semibold">{sourceArray}</span>
                    <span className="text-slate-500">=</span>
                </motion.div>

                {/* Step 2: Array Elements Container */}
                <div className="flex items-start gap-1 mb-2 ml-4">
                    <motion.span 
                        className="text-slate-400 text-xl font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        [
                    </motion.span>
                    
                    {arrayValue.map((val, idx) => (
                        <motion.div
                            key={idx}
                            className="flex flex-col items-center"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.1, duration: 0.3 }}
                        >
                            {/* Element Box */}
                            <motion.div
                                className={`w-14 h-14 flex items-center justify-center rounded-lg font-mono text-lg font-bold border-2 relative
                                    ${idx === index && (isPlaying || isComplete)
                                        ? 'bg-teal-500/30 border-teal-400 text-teal-200 shadow-lg shadow-teal-500/30' 
                                        : 'bg-slate-800 border-slate-600 text-slate-300'}`}
                                animate={isPlaying && idx === index ? {
                                    scale: [1, 1.15, 1.15, 1.1],
                                    boxShadow: [
                                        '0 0 0 rgba(45,212,191,0)',
                                        '0 0 20px rgba(45,212,191,0.5)',
                                        '0 0 25px rgba(45,212,191,0.6)',
                                        '0 0 15px rgba(45,212,191,0.4)'
                                    ]
                                } : {}}
                                transition={{ delay: 1.2, duration: 0.5 }}
                            >
                                {val}
                                
                                {/* Pointer indicator on selected index */}
                                {idx === index && (isPlaying || isComplete) && (
                                    <motion.div
                                        className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 1.2, duration: 0.3 }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-teal-400 font-mono font-bold whitespace-nowrap">
                                                {sourceArray}[{index}]
                                            </span>
                                            <motion.svg 
                                                width="16" height="16" 
                                                viewBox="0 0 24 24" 
                                                fill="none" 
                                                className="text-teal-400"
                                                animate={isPlaying ? { y: [0, 3, 0] } : {}}
                                                transition={{ repeat: 3, duration: 0.3, delay: 1.4 }}
                                            >
                                                <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                            </motion.svg>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                            
                            {/* Index Label */}
                            <motion.span 
                                className={`text-xs mt-1 font-mono ${idx === index ? 'text-teal-400 font-bold' : 'text-slate-500'}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.8 + idx * 0.05, duration: 0.2 }}
                            >
                                [{idx}]
                            </motion.span>
                        </motion.div>
                    ))}
                    
                    <motion.span 
                        className="text-slate-400 text-xl font-mono"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + arrayValue.length * 0.1 }}
                    >
                        ]
                    </motion.span>
                </div>

                {/* Step 3: Animated Value Transfer */}
                <div className="relative h-20 my-4">
                    <AnimatePresence>
                        {(isPlaying || isComplete) && (
                            <motion.div
                                className="absolute left-1/2 transform -translate-x-1/2"
                                initial={{ opacity: 0, y: 0 }}
                                animate={{ 
                                    opacity: [0, 1, 1, 1],
                                    y: [0, 10, 40, 60]
                                }}
                                transition={{ 
                                    delay: 1.8,
                                    duration: 1.0,
                                    times: [0, 0.2, 0.6, 1],
                                    ease: "easeInOut"
                                }}
                            >
                                <motion.div 
                                    className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-xl shadow-teal-500/50 font-mono font-bold text-white text-lg"
                                    animate={isPlaying ? {
                                        scale: [1, 1.1, 1],
                                    } : {}}
                                    transition={{ delay: 2.2, duration: 0.3 }}
                                >
                                    {resultValue !== undefined ? String(resultValue) : ''}
                                </motion.div>
                                
                                {/* Trail effect */}
                                <motion.div
                                    className="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 bg-gradient-to-b from-teal-400 to-transparent"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 40, opacity: [0, 0.8, 0] }}
                                    transition={{ delay: 1.9, duration: 0.8 }}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Step 4: Target Variable Receiving Value */}
                <motion.div
                    className="flex items-center gap-3 ml-4"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.6, duration: 0.3 }}
                >
                    <span className="text-sm font-mono text-blue-400 font-semibold">{targetVar}</span>
                    <span className="text-slate-500">=</span>
                    
                    <motion.div
                        className="relative"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={isPlaying || isComplete ? { scale: 1, opacity: 1 } : {}}
                        transition={{ delay: 2.8, duration: 0.4, type: 'spring', stiffness: 300 }}
                    >
                        <motion.div
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-teal-500/20 to-blue-500/20 border-2 border-teal-400 font-mono font-bold text-teal-300 text-lg"
                            animate={isPlaying ? {
                                boxShadow: [
                                    '0 0 0 rgba(45,212,191,0)',
                                    '0 0 30px rgba(45,212,191,0.6)',
                                    '0 0 15px rgba(45,212,191,0.3)'
                                ]
                            } : {}}
                            transition={{ delay: 3.0, duration: 0.5 }}
                        >
                            {resultValue !== undefined ? String(resultValue) : ''}
                        </motion.div>
                        
                        {/* Sparkle effect on landing */}
                        {(isPlaying || isComplete) && (
                            <motion.div
                                className="absolute -inset-2 rounded-xl border-2 border-teal-400"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1.2] }}
                                transition={{ delay: 2.9, duration: 0.5 }}
                            />
                        )}
                    </motion.div>
                </motion.div>

                {/* Completion indicator */}
                {isComplete && (
                    <motion.div
                        className="absolute top-3 right-3"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                    >
                        <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/50">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Render for loop animation
    const renderForLoopAnimation = () => {
        const { loopVar, iterable, iterableValue, currentValue } = stepType;
        const isPlaying = animationPhase === 'playing';
        const foundIndex = iterableValue.indexOf(currentValue);
        const currentIndex = foundIndex >= 0 ? foundIndex : 0;

        return (
            <div className="relative p-6 bg-slate-900/60 rounded-xl overflow-hidden">
                {/* Iterable Array */}
                <div className="mb-4">
                    <div className="text-xs text-slate-400 mb-2 font-mono">{iterable}</div>
                    <div className="flex gap-1 items-center flex-wrap">
                        <span className="text-slate-500">[</span>
                        {iterableValue.map((val, idx) => (
                            <motion.div
                                key={idx}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg font-mono font-bold border-2 transition-all
                                    ${idx === currentIndex 
                                        ? 'bg-purple-500/30 border-purple-400 text-purple-300' 
                                        : idx < currentIndex
                                            ? 'bg-slate-700 border-slate-500 text-slate-400'
                                            : 'bg-slate-800 border-slate-600 text-slate-300'}`}
                                animate={isPlaying && idx === currentIndex ? {
                                    scale: [1, 1.15, 1],
                                    borderColor: ['#475569', '#a855f7', '#a855f7']
                                } : {}}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                {val}
                            </motion.div>
                        ))}
                        <span className="text-slate-500">]</span>
                    </div>
                </div>

                {/* Arrow showing iteration */}
                <AnimatePresence>
                    {isPlaying && (
                        <motion.div
                            className="flex justify-center my-3"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ repeat: 2, duration: 0.4 }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-purple-400">
                                    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Current Loop Variable */}
                <motion.div
                    className="flex items-center gap-3 mt-4"
                    animate={isPlaying ? { x: [0, 5, 0] } : {}}
                    transition={{ delay: 1, duration: 0.3 }}
                >
                    <div className="px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/50">
                        <span className="font-mono text-purple-300 font-bold">{loopVar}</span>
                        <span className="text-slate-500 mx-2">=</span>
                        <motion.span
                            className="font-mono text-purple-200 font-bold"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.2 }}
                        >
                            {currentValue !== undefined ? String(currentValue) : (iterableValue[currentIndex] !== undefined ? String(iterableValue[currentIndex]) : '')}
                        </motion.span>
                    </div>
                    <span className="text-xs text-slate-500">(iteration {currentIndex + 1} of {iterableValue.length})</span>
                </motion.div>

                {animationPhase === 'complete' && (
                    <motion.div
                        className="absolute top-3 right-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <path d="M17 1l4 4-4 4" />
                                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Render condition animation
    const renderConditionAnimation = () => {
        const { leftVar, rightVar, leftValue, rightValue, operator, result, condition } = stepType;
        const isPlaying = animationPhase === 'playing';

        return (
            <div className="relative p-6 bg-slate-900/60 rounded-xl overflow-hidden">
                {/* Comparison visualization */}
                <div className="flex items-center justify-center gap-4 mb-6">
                    {/* Left value */}
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ x: -30, opacity: 0 }}
                        animate={isPlaying ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="text-xs text-slate-400 mb-1 font-mono">{leftVar}</div>
                        <motion.div
                            className="w-14 h-14 rounded-xl bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center font-mono text-xl font-bold text-blue-300"
                            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            {leftValue}
                        </motion.div>
                    </motion.div>

                    {/* Operator */}
                    <motion.div
                        className="text-2xl font-bold text-yellow-400"
                        initial={{ scale: 0 }}
                        animate={isPlaying ? { scale: [0, 1.2, 1] } : { scale: 1 }}
                        transition={{ delay: 0.5, duration: 0.3 }}
                    >
                        {operator}
                    </motion.div>

                    {/* Right value */}
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ x: 30, opacity: 0 }}
                        animate={isPlaying ? { x: 0, opacity: 1 } : { x: 0, opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="text-xs text-slate-400 mb-1 font-mono">{rightVar}</div>
                        <motion.div
                            className="w-14 h-14 rounded-xl bg-orange-500/20 border-2 border-orange-400 flex items-center justify-center font-mono text-xl font-bold text-orange-300"
                            animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            {rightValue}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Result */}
                <motion.div
                    className="flex justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={isPlaying || animationPhase === 'complete' ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: 1, duration: 0.4 }}
                >
                    <motion.div
                        className={`px-6 py-3 rounded-xl font-bold text-lg flex items-center gap-2 ${
                            result 
                                ? 'bg-green-500/20 border-2 border-green-400 text-green-400' 
                                : 'bg-red-500/20 border-2 border-red-400 text-red-400'
                        }`}
                        animate={isPlaying ? { scale: [0.8, 1.1, 1] } : {}}
                        transition={{ delay: 1.2, duration: 0.3, type: 'spring' }}
                    >
                        {result ? (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20,6 9,17 4,12" />
                                </svg>
                                TRUE → enters if block
                            </>
                        ) : (
                            <>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                FALSE → skips if block
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {animationPhase === 'complete' && (
                    <motion.div
                        className="absolute top-3 right-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className={`w-6 h-6 rounded-full ${result ? 'bg-green-500' : 'bg-red-500'} flex items-center justify-center`}>
                            {result ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <polyline points="20,6 9,17 4,12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Render simple assignment animation
    const renderAssignmentAnimation = () => {
        const { targetVar, expression, targetValue, sourceVar, sourceValue } = stepType;
        const isPlaying = animationPhase === 'playing';

        return (
            <div className="relative p-6 bg-slate-900/60 rounded-xl overflow-hidden">
                <div className="flex items-center justify-center gap-4">
                    {/* Source (if from another variable) */}
                    {sourceVar && (
                        <>
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ opacity: 0.5 }}
                                animate={isPlaying ? { opacity: 1 } : { opacity: 1 }}
                            >
                                <div className="text-xs text-slate-400 mb-1 font-mono">{sourceVar}</div>
                                <motion.div
                                    className="w-12 h-12 rounded-lg bg-blue-500/20 border-2 border-blue-400 flex items-center justify-center font-mono font-bold text-blue-300"
                                    animate={isPlaying ? { scale: [1, 1.15, 1] } : {}}
                                    transition={{ duration: 0.4 }}
                                >
                                    {sourceValue}
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={isPlaying ? { opacity: 1, x: 0 } : { opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-teal-400">
                                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                </svg>
                            </motion.div>
                        </>
                    )}

                    {/* Target variable */}
                    <motion.div
                        className="flex flex-col items-center"
                        initial={{ opacity: 0.5 }}
                        animate={isPlaying || animationPhase === 'complete' ? { opacity: 1 } : {}}
                        transition={{ delay: sourceVar ? 0.6 : 0.2 }}
                    >
                        <div className="text-xs text-slate-400 mb-1 font-mono">{targetVar}</div>
                        <motion.div
                            className="min-w-[3rem] h-12 px-3 rounded-lg bg-teal-500/20 border-2 border-teal-400 flex items-center justify-center font-mono font-bold text-teal-300"
                            initial={{ scale: 0.8 }}
                            animate={isPlaying || animationPhase === 'complete' ? { scale: 1 } : {}}
                            transition={{ delay: sourceVar ? 0.8 : 0.4, type: 'spring' }}
                        >
                            {targetValue !== undefined ? String(targetValue) : expression}
                        </motion.div>
                    </motion.div>
                </div>

                {animationPhase === 'complete' && (
                    <motion.div
                        className="absolute top-3 right-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Render return animation
    const renderReturnAnimation = () => {
        const { expression, value } = stepType;
        const isPlaying = animationPhase === 'playing';

        return (
            <div className="relative p-6 bg-slate-900/60 rounded-xl overflow-hidden">
                <div className="flex flex-col items-center">
                    <motion.div
                        className="text-sm text-slate-400 mb-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        Returning from function
                    </motion.div>
                    
                    <motion.div
                        className="flex items-center gap-3"
                        initial={{ y: 20, opacity: 0 }}
                        animate={isPlaying || animationPhase === 'complete' ? { y: 0, opacity: 1 } : {}}
                        transition={{ delay: 0.3, type: 'spring' }}
                    >
                        <span className="text-green-400 font-mono font-bold">return</span>
                        <motion.div
                            className="px-6 py-3 rounded-xl bg-green-500/20 border-2 border-green-400 font-mono text-xl font-bold text-green-300"
                            animate={isPlaying ? { 
                                scale: [1, 1.15, 1],
                                boxShadow: ['0 0 0 rgba(34,197,94,0)', '0 0 30px rgba(34,197,94,0.5)', '0 0 15px rgba(34,197,94,0.3)']
                            } : {}}
                            transition={{ delay: 0.5, duration: 0.6 }}
                        >
                            {value}
                        </motion.div>
                        <motion.span
                            className="text-2xl"
                            initial={{ scale: 0 }}
                            animate={isPlaying || animationPhase === 'complete' ? { scale: 1 } : {}}
                            transition={{ delay: 1, type: 'spring' }}
                        >
                            ✓
                        </motion.span>
                    </motion.div>
                </div>

                {animationPhase === 'complete' && (
                    <motion.div
                        className="absolute top-3 right-3"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Generic fallback animation
    const renderGenericAnimation = () => {
        const isPlaying = animationPhase === 'playing';

        return (
            <div className="relative p-4 bg-slate-900/60 rounded-xl">
                <motion.div
                    className="font-mono text-sm text-slate-300 bg-slate-800 rounded-lg p-3"
                    initial={{ opacity: 0.5 }}
                    animate={isPlaying || animationPhase === 'complete' ? { opacity: 1 } : {}}
                >
                    {step.code}
                </motion.div>
                {animationPhase === 'complete' && (
                    <motion.div
                        className="absolute top-2 right-2"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                    >
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20,6 9,17 4,12" />
                            </svg>
                        </div>
                    </motion.div>
                )}
            </div>
        );
    };

    // Select the right animation renderer
    const renderAnimation = () => {
        switch (stepType.type) {
            case 'array_access':
                return renderArrayAccessAnimation();
            case 'for_loop':
                return renderForLoopAnimation();
            case 'condition':
                return renderConditionAnimation();
            case 'assignment':
                return renderAssignmentAnimation();
            case 'return':
                return renderReturnAnimation();
            default:
                return renderGenericAnimation();
        }
    };

    return (
        <div className="relative">
            {/* Animation Container */}
            {renderAnimation()}

            {/* Replay Button */}
            <AnimatePresence>
                {showReplay && (
                    <motion.button
                        className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors"
                        onClick={handleReplay}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 4v6h6M23 20v-6h-6" />
                            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                        </svg>
                        Replay
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AnimatedStepCard;
