import React, { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaLightbulb, FaClock, FaCheckCircle } from 'react-icons/fa';
import { HiSparkles, HiChartBar, HiBookOpen } from 'react-icons/hi2';
import { DSAImmersiveVisualizer } from '../components/DSAVisualizer';

// API Base URL - same as CodeVisualizerPage
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/visualizer`
    : 'http://localhost:8000/api/visualizer';

// Pre-defined code template for each DSA problem (array is injected dynamically)
const PROBLEM_CODE_TEMPLATES = {
    'merge-sort': (arrString) => `def merge_sort(arr):
    # Base case: single element is sorted
    if len(arr) <= 1:
        return arr
    
    # DIVIDE: split into halves
    mid = len(arr) // 2
    left = arr[:mid]
    right = arr[mid:]
    
    # CONQUER: recursively sort each half
    left_sorted = merge_sort(left)
    right_sorted = merge_sort(right)
    
    # COMBINE: merge sorted halves
    return merge(left_sorted, right_sorted)


def merge(left, right):
    result = []
    i = j = 0
    
    # Compare elements from both arrays
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    
    # Add remaining elements
    result.extend(left[i:])
    result.extend(right[j:])
    return result


# Run the algorithm
arr = ${arrString}
result = merge_sort(arr)
print(result)`,

    'quick-sort': (arrString) => `def quick_sort(nums, low, high):
    if low >= high:
        return
    
    pivot = nums[(low + high) // 2]
    
    i = low
    j = high
    
    while i <= j:
        while nums[i] < pivot:
            i += 1
        while nums[j] > pivot:
            j -= 1
        
        if i <= j:
            nums[i], nums[j] = nums[j], nums[i]
            i += 1
            j -= 1
    
    quick_sort(nums, low, j)
    quick_sort(nums, i, high)


# Run
nums = ${arrString}
quick_sort(nums, 0, len(nums) - 1)
print(nums)`,

    'bubble-sort': (arrString) => `def bubble_sort(arr):
    n = len(arr)

    for i in range(n):
        swapped = False

        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True

        # If no swaps -> already sorted
        if not swapped:
            break

    return arr



arr = ${arrString}

sorted_arr = bubble_sort(arr)
print("Sorted Array:", sorted_arr)`,

    'insertion-sort': (arrString) => `def insertion_sort(arr):
    n = len(arr)

    for i in range(1, n):
        key = arr[i]
        j = i - 1

        # Shift elements greater than key
        # to one position ahead
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1

        arr[j + 1] = key

    return arr



arr = ${arrString}

sorted_arr = insertion_sort(arr)
print("Sorted Array:", sorted_arr)`,

    'selection-sort': (arrString) => `def selection_sort(arr):
    n = len(arr)

    for i in range(n - 1):
        min_index = i

        # Find minimum in remaining unsorted array
        for j in range(i + 1, n):
            if arr[j] < arr[min_index]:
                min_index = j

        # Swap only if needed
        if min_index != i:
            arr[i], arr[min_index] = arr[min_index], arr[i]

    return arr



arr = ${arrString}

sorted_arr = selection_sort(arr)
print("Sorted Array:", sorted_arr)`,
};

// Default array for each problem
const DEFAULT_ARRAYS = {
    'merge-sort':      '[38, 27, 43, 3, 9, 82, 10]',
    'quick-sort':      '[8, 3, 1, 5, 2, 7, 4]',
    'bubble-sort':     '[5, 1, 4, 2, 8, 0, 2]',
    'selection-sort':  '[64, 25, 12, 22, 11]',
    'insertion-sort':  '[12, 11, 13, 5, 6]',
};

// Problem metadata
const problemsData = {
    'merge-sort': {
        id: 1,
        name: "Merge Sort",
        difficulty: "Medium",
        category: "Divide & Conquer",
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n)",
        description: "Implement the Merge Sort algorithm to sort an array of integers in ascending order. Merge Sort is a divide-and-conquer algorithm that divides the input array into two halves, recursively sorts them, and then merges the sorted halves.",
        concepts: [
            "Divide and Conquer Strategy",
            "Recursion",
            "Merging Sorted Arrays",
            "Time Complexity Analysis"
        ]
    },
    'quick-sort': {
        id: 2,
        name: "Quick Sort",
        difficulty: "Medium",
        category: "Divide & Conquer",
        timeComplexity: "O(n log n) avg",
        spaceComplexity: "O(log n)",
        description: "Implement Quick Sort using a middle-element pivot strategy. Quick Sort is an in-place divide-and-conquer algorithm that partitions the array around a pivot, placing elements smaller than the pivot to the left and larger to the right, then recursively sorts both partitions.",
        concepts: [
            "In-place Partitioning",
            "Two-pointer Technique",
            "Pivot Selection Strategy",
            "Recursive Divide & Conquer"
        ]
    },
    'bubble-sort': {
        id: 3,
        name: "Bubble Sort",
        difficulty: "Easy",
        category: "Sorting",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        description: "Implement Bubble Sort to sort an array of integers. Bubble Sort repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. After each pass, the largest unsorted element \"bubbles up\" to its correct position. An early-exit optimization stops the algorithm when no swaps occur in a pass.",
        concepts: [
            "Adjacent Element Comparison",
            "In-place Sorting",
            "Early Exit Optimization",
            "Pass-based Iteration"
        ]
    },
    'insertion-sort': {
        id: 5,
        name: "Insertion Sort",
        difficulty: "Easy",
        category: "Sorting",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        description: "Implement Insertion Sort to sort an array of integers. Insertion Sort builds the sorted array one element at a time by picking each element (the \"key\") and shifting larger sorted elements one position to the right until the correct position for the key is found. It is efficient for small or nearly-sorted arrays.",
        concepts: [
            "Key Element Selection",
            "In-place Sorting",
            "Shifting vs Swapping",
            "Best Case O(n) on Nearly Sorted Data"
        ]
    },
    'selection-sort': {
        id: 4,
        name: "Selection Sort",
        difficulty: "Easy",
        category: "Sorting",
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        description: "Implement Selection Sort to sort an array of integers. Selection Sort divides the input into a sorted left region and an unsorted right region. On each pass it scans the unsorted region to find the minimum element, then swaps it into its correct sorted position. The swap is skipped when the minimum is already in place.",
        concepts: [
            "Minimum Element Selection",
            "In-place Sorting",
            "Conditional Swap Optimisation",
            "Pass-based Iteration"
        ]
    },
};

const DSAProblemPage = () => {
    const { problemName } = useParams();
    const problem = problemsData[problemName];

    // Custom array input state
    const [customArrayInput, setCustomArrayInput] = useState(DEFAULT_ARRAYS[problemName] || '[38, 27, 43, 3, 9, 82, 10]');
    const [arrayError, setArrayError] = useState('');

    // Generate code with custom array
    const code = PROBLEM_CODE_TEMPLATES[problemName]
        ? PROBLEM_CODE_TEMPLATES[problemName](customArrayInput)
        : '';

    // Visualizer state (same pattern as CodeVisualizerPage)
    const [showVisualizer, setShowVisualizer] = useState(false);
    const [isLoadingTrace, setIsLoadingTrace] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState(0);
    const [steps, setSteps] = useState([]);
    const [executionId, setExecutionId] = useState(null);
    const [error, setError] = useState(null);

    // Validate array input
    const validateArrayInput = (input) => {
        const trimmed = input.trim();
        if (!trimmed.startsWith('[') || !trimmed.endsWith(']')) {
            return 'Array must start with [ and end with ]';
        }
        const inner = trimmed.slice(1, -1).trim();
        if (!inner) {
            return 'Array cannot be empty';
        }
        const parts = inner.split(',').map(p => p.trim());
        for (const part of parts) {
            if (!/^-?\d+$/.test(part)) {
                return `Invalid number: ${part}`;
            }
        }
        if (parts.length > 15) {
            return 'Maximum 15 elements allowed for visualization';
        }
        return '';
    };

    const handleArrayInputChange = (e) => {
        const value = e.target.value;
        setCustomArrayInput(value);
        setArrayError(validateArrayInput(value));
    };

    // Handle rerun with a specific array (called from visualizer)
    const handleRerunWithArray = useCallback(async (newArrayString) => {
        setCustomArrayInput(newArrayString);
        setShowVisualizer(true);
        setIsLoadingTrace(true);
        setSteps([]);
        setExecutionId(null);
        setError(null);

        // Generate code with the new array directly
        const newCode = PROBLEM_CODE_TEMPLATES[problemName](newArrayString);

        // Loading phases
        setLoadingPhase(1);
        await new Promise(resolve => setTimeout(resolve, 300));
        setLoadingPhase(2);
        await new Promise(resolve => setTimeout(resolve, 300));
        setLoadingPhase(3);

        try {
            const response = await fetch(`${API_BASE_URL}/trace-stream/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    code: newCode,
                    inputs: [],
                    codeType: 'script',
                    functionName: null,
                    className: null,
                    inputTypes: []
                })
            });

            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('text/event-stream')) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                const collectedSteps = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === 'error') {
                                    setError(data.message);
                                    setShowVisualizer(false);
                                    setIsLoadingTrace(false);
                                    break;
                                }

                                if (data.type === 'step') {
                                    setLoadingPhase(4);
                                    collectedSteps.push({
                                        lineNumber: data.line,
                                        code: data.code,
                                        explanation: data.explanation,
                                        variables: data.locals,
                                        changedVars: data.changed_vars || [],
                                        computed_values: data.computed_values,
                                        event: data.event,
                                        functionName: data.function_name,
                                        phase: data.phase,
                                        return_value: data.return_value
                                    });
                                }

                                if (data.type === 'frame') {
                                    setLoadingPhase(4);
                                    const frame = data.frame;
                                    collectedSteps.push({
                                        lineNumber: frame.line,
                                        code: frame.code,
                                        explanation: frame.explanation,
                                        variables: frame.locals,
                                        changedVars: frame.changed_vars || [],
                                        computed_values: frame.computed_values,
                                        event: frame.event,
                                        functionName: frame.function_name,
                                        phase: frame.phase,
                                        return_value: frame.return_value
                                    });
                                }

                                if (data.type === 'complete') {
                                    if (data.execution_id) setExecutionId(data.execution_id);
                                    setSteps(collectedSteps);
                                    setIsLoadingTrace(false);
                                }
                            } catch (e) {
                                // Skip malformed JSON
                            }
                        }
                    }
                }
            } else {
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                    setShowVisualizer(false);
                } else if (data.frames) {
                    const transformedSteps = data.frames.map(frame => ({
                        lineNumber: frame.line,
                        code: frame.code,
                        explanation: frame.explanation,
                        variables: frame.locals,
                        changedVars: frame.changed_vars || [],
                        computed_values: frame.computed_values,
                        event: frame.event,
                        functionName: frame.function_name,
                        phase: frame.phase,
                        return_value: frame.return_value
                    }));
                    setSteps(transformedSteps);
                    if (data.execution_id) setExecutionId(data.execution_id);
                }
                setIsLoadingTrace(false);
            }
        } catch (err) {
            console.error('Trace error:', err);
            setError('Failed to execute code. Please try again.');
            setShowVisualizer(false);
            setIsLoadingTrace(false);
        }
    }, [problemName]);

    // Run the trace (same logic as CodeVisualizerPage)
    const handleVisualize = useCallback(async () => {
        setShowVisualizer(true);
        setIsLoadingTrace(true);
        setSteps([]);
        setExecutionId(null);
        setError(null);

        // Loading phases
        setLoadingPhase(1);
        await new Promise(resolve => setTimeout(resolve, 300));
        setLoadingPhase(2);
        await new Promise(resolve => setTimeout(resolve, 300));
        setLoadingPhase(3);

        try {
            const response = await fetch(`${API_BASE_URL}/trace-stream/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
                body: JSON.stringify({
                    code: code,
                    inputs: [],
                    codeType: 'script',
                    functionName: null,
                    className: null,
                    inputTypes: []
                })
            });

            const contentType = response.headers.get('content-type');

            if (contentType && contentType.includes('text/event-stream')) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                const collectedSteps = [];

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            try {
                                const data = JSON.parse(line.slice(6));

                                if (data.type === 'error') {
                                    setError(data.error);
                                    setSteps([]);
                                    setShowVisualizer(false);
                                    setIsLoadingTrace(false);
                                    return;
                                }

                                if (data.type === 'metadata') {
                                    setLoadingPhase(4);
                                    if (data.execution_id) {
                                        setExecutionId(data.execution_id);
                                    }
                                }

                                if (data.type === 'frame') {
                                    const frame = data.frame;
                                    collectedSteps.push({
                                        lineNumber: frame.line,
                                        code: frame.code,
                                        explanation: frame.explanation,
                                        variables: frame.locals,
                                        changedVars: frame.changed_vars || [],
                                        computed_values: frame.computed_values,
                                        event: frame.event,
                                        functionName: frame.function_name,
                                        phase: frame.phase,
                                        state_before: frame.state_before,
                                        state_after: frame.state_after,
                                        var_transitions: frame.var_transitions,
                                        return_value: frame.return_value
                                    });
                                }

                                if (data.type === 'complete') {
                                    setSteps(collectedSteps);
                                    setIsLoadingTrace(false);
                                }
                            } catch (e) {
                                // Skip malformed JSON
                            }
                        }
                    }
                }
                // Fallback: if stream ended without a complete event
                if (collectedSteps.length > 0) {
                    setSteps(prev => prev.length === 0 ? collectedSteps : prev);
                    setIsLoadingTrace(false);
                }
            } else {
                // Non-streaming fallback
                const data = await response.json();
                if (data.error) {
                    setError(data.error);
                    setShowVisualizer(false);
                } else if (data.frames) {
                    const transformedSteps = data.frames.map(frame => ({
                        lineNumber: frame.line,
                        code: frame.code,
                        explanation: frame.explanation,
                        variables: frame.locals,
                        changedVars: frame.changed_vars || [],
                        computed_values: frame.computed_values,
                        event: frame.event,
                        functionName: frame.function_name,
                        phase: frame.phase,
                        return_value: frame.return_value
                    }));
                    setSteps(transformedSteps);
                    if (data.execution_id) setExecutionId(data.execution_id);
                }
                setIsLoadingTrace(false);
            }
        } catch (err) {
            console.error('Trace error:', err);
            setError('Failed to execute code. Please try again.');
            setShowVisualizer(false);
            setIsLoadingTrace(false);
        }
    }, [code]);

    if (!problem) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800 mb-2">Problem Not Found</h1>
                    <p className="text-slate-500 mb-4">This problem is coming soon!</p>
                    <Link to="/" className="text-blue-600 hover:underline">← Back to Home</Link>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Hard': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // DSAImmersiveVisualizer is rendered when showVisualizer is true
    return (
        <>
            {/* Custom DSA Visualizer with algorithm-specific animations */}
            <DSAImmersiveVisualizer
                isOpen={showVisualizer}
                onClose={() => setShowVisualizer(false)}
                steps={steps}
                code={code}
                isLoading={isLoadingTrace}
                loadingPhase={loadingPhase}
                algorithmType={problemName}
                customArray={customArrayInput}
                onRerun={handleRerunWithArray}
            />

            {/* Problem Detail View */}
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                </div>

                {/* Header */}
                <header className="relative z-10 border-b border-white/10">
                    <div className="max-w-6xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                                <FaArrowLeft className="text-sm" />
                                <span className="text-sm font-medium">Back to Home</span>
                            </Link>
                            <div className="flex items-center gap-2">
                                <HiBookOpen className="text-blue-400" />
                                <span className="text-white/80 text-sm font-medium">EasyLearnova DSA Sheet</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 max-w-4xl mx-auto px-6 py-12">
                    {/* Problem Header */}
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                            </span>
                            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                                {problem.category}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                            {problem.name}
                        </h1>
                        <p className="text-slate-400 text-lg">
                            Problem #{problem.id} • {problem.category}
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-10 max-w-md mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
                                <FaClock className="text-sm" />
                                <span className="text-xs font-medium text-slate-400">Time</span>
                            </div>
                            <p className="text-white font-bold">{problem.timeComplexity}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center">
                            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
                                <HiChartBar className="text-sm" />
                                <span className="text-xs font-medium text-slate-400">Space</span>
                            </div>
                            <p className="text-white font-bold">{problem.spaceComplexity}</p>
                        </div>
                    </div>

                    {/* Description Card */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                            <FaLightbulb className="text-amber-400" />
                            About this Problem
                        </h3>
                        <p className="text-slate-300 leading-relaxed">
                            {problem.description}
                        </p>
                    </div>

                    {/* Concepts */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-10">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <FaCheckCircle className="text-emerald-400" />
                            What You'll Learn
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {problem.concepts.map((concept, idx) => (
                                <div key={idx} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                        <span className="text-emerald-400 text-xs">✓</span>
                                    </div>
                                    <span className="text-slate-300 text-sm">{concept}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 text-center">
                            {error}
                        </div>
                    )}

                    {/* Custom Array Input */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                            <HiSparkles className="text-amber-400" />
                            Try Your Own Array
                        </h3>
                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customArrayInput}
                                    onChange={handleArrayInputChange}
                                    placeholder="[1, 2, 3, 4, 5]"
                                    className={`w-full px-4 py-3 bg-slate-800 border rounded-xl text-white font-mono text-lg focus:outline-none focus:ring-2 transition-all ${arrayError
                                        ? 'border-red-500/50 focus:ring-red-500/30'
                                        : 'border-white/20 focus:ring-blue-500/30 focus:border-blue-500/50'
                                        }`}
                                />
                                {customArrayInput !== DEFAULT_ARRAYS[problemName] && (
                                    <button
                                        onClick={() => {
                                            setCustomArrayInput(DEFAULT_ARRAYS[problemName]);
                                            setArrayError('');
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-sm px-2 py-1 bg-slate-700 rounded-lg transition-colors"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            {arrayError ? (
                                <p className="text-red-400 text-sm flex items-center gap-1">
                                    <span>⚠️</span> {arrayError}
                                </p>
                            ) : (
                                <p className="text-slate-500 text-sm">
                                    Enter comma-separated integers (max 15 elements)
                                </p>
                            )}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="text-center">
                        <button
                            onClick={handleVisualize}
                            disabled={!!arrayError}
                            className={`group relative inline-flex items-center gap-4 px-10 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xl rounded-2xl shadow-2xl transition-all duration-300 ${arrayError
                                ? 'opacity-50 cursor-not-allowed shadow-none'
                                : 'hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'
                                }`}
                        >
                            {/* Glow effect */}
                            {!arrayError && (
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                            )}

                            <div className="relative flex items-center gap-4">
                                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <FaPlay className="text-lg" />
                                </div>
                                <div className="text-left">
                                    <span className="block text-xl font-bold">Let's Visualize!</span>
                                    <span className="block text-sm text-white/70 font-normal">See the algorithm in action</span>
                                </div>
                                <HiSparkles className="text-2xl text-amber-300 group-hover:animate-pulse" />
                            </div>
                        </button>

                        <p className="mt-6 text-slate-500 text-sm">
                            Watch each step of the algorithm execute with our interactive visualizer
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-white/10 mt-16">
                    <div className="max-w-6xl mx-auto px-6 py-6">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500 text-sm">© 2026 EasyLearnova</span>
                            <Link to="/" className="text-slate-400 hover:text-white text-sm transition-colors">
                                ← Back to Code Visualizer
                            </Link>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default DSAProblemPage;
