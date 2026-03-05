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

    'char-replacement': (inputStr) => {
        const parts = inputStr.split(',');
        const s = (parts[0]?.trim() || 'AABABBAC').toUpperCase();
        const k = parseInt(parts[1]?.trim(), 10) || 2;
        return `def character_replacement(s, k):
    freq = [0] * 26
    left = 0
    max_len = 0
    max_freq = 0

    for right in range(len(s)):
        index = ord(s[right]) - ord('A')
        freq[index] += 1
        max_freq = max(max_freq, freq[index])

        # If replacements needed exceed k, shrink window
        if (right - left + 1) - max_freq > k:
            freq[ord(s[left]) - ord('A')] -= 1
            left += 1

        max_len = max(max_len, right - left + 1)

    return max_len

s = "${s}"
k = ${k}
result = character_replacement(s, k)
print(result)`;
    },

    'binary-search': (inputStr) => {
        const commaIdx = inputStr.lastIndexOf(',');
        const arrPart = commaIdx >= 0 ? inputStr.slice(0, commaIdx).trim() : '[3, 12, 18, 25, 31, 42, 63]';
        const tgt     = commaIdx >= 0 ? inputStr.slice(commaIdx + 1).trim() : '31';
        return `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = left + (right - left) // 2

        if arr[mid] == target:
            return mid

        elif arr[mid] < target:
            left = mid + 1

        else:
            right = mid - 1

    return -1


arr = ${arrPart}
target = ${tgt}
result = binary_search(arr, target)
print("Index:", result)`;
    },
};

// Default array for each problem
const DEFAULT_ARRAYS = {
    'merge-sort':        '[38, 27, 43, 3, 9, 82, 10]',
    'quick-sort':        '[8, 3, 1, 5, 2, 7, 4]',
    'bubble-sort':       '[5, 1, 4, 2, 8, 0, 2]',
    'selection-sort':    '[64, 25, 12, 22, 11]',
    'insertion-sort':    '[12, 11, 13, 5, 6]',
    'char-replacement':  'AABABBAC,2',
    'binary-search':     '[3, 12, 18, 25, 31, 42, 63],31',
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
    'char-replacement': {
        id: 6,
        name: "Longest Repeating Character Replacement",
        difficulty: "Medium",
        category: "Sliding Window",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        description: "Given a string s and an integer k, find the length of the longest substring you can get by replacing at most k characters. A sliding window tracks the current window size and the count of the most frequent character inside it. If the remaining characters (window size − max_freq) exceed k, shrink the window from the left.",
        concepts: [
            "Sliding Window Technique",
            "Character Frequency Tracking",
            "Two-Pointer Approach",
            "Greedy Window Expansion"
        ]
    },
    'binary-search': {
        id: 7,
        name: "Binary Search",
        difficulty: "Easy",
        category: "Searching",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        description: "Given a sorted array and a target value, return the index of the target if found, or -1 if not present. Binary Search repeatedly halves the search range by comparing the middle element to the target, discarding the half that cannot contain the target.",
        concepts: [
            "Divide and Conquer",
            "Two-Pointer (L / R) Approach",
            "Logarithmic Time Complexity",
            "Sorted Array Requirement"
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

    // Validate array input (handles both numeric arrays and char-replacement 'S,k' format)
    const validateArrayInput = (input) => {
        if (problemName === 'char-replacement') {
            const trimmed = input.trim();
            const parts = trimmed.split(',');
            if (parts.length !== 2) return 'Format: LETTERS,k  (e.g. AABABBAC,2)';
            const s = parts[0].trim();
            const k = parts[1].trim();
            if (!/^[A-Za-z]+$/.test(s)) return 'First part must be letters only (e.g. AABABBAC)';
            if (!/^\d+$/.test(k)) return 'Second part must be a non-negative integer (e.g. 2)';
            if (s.length > 20) return 'String too long (max 20 characters)';
            return '';
        }
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
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f0c29,#1a1060,#24243e 60%,#0d1b4b)' }}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Problem Not Found</h1>
                    <p className="text-white/40 mb-4">This problem is coming soon!</p>
                    <Link to="/" className="text-indigo-300 hover:text-white transition-colors">← Back to Home</Link>
                </div>
            </div>
        );
    }

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 'Easy':   return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
            case 'Medium': return 'bg-amber-500/15  text-amber-300  border-amber-500/30';
            case 'Hard':   return 'bg-red-500/15    text-red-300    border-red-500/30';
            default:       return 'bg-white/10      text-white/60   border-white/20';
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

            {/* ═══════ Problem Preview — Premium Layout ═══════ */}
            <div className="min-h-screen bg-[#0B0E1A]">

                {/* ── Compact Top Bar ── */}
                <nav className="sticky top-0 z-20 bg-[#0B0E1A] border-b border-white/[0.06]">
                    <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
                        <Link to="/" className="group flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm">
                            <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
                            Home
                        </Link>
                        <span className="text-white/20 text-[10px] font-semibold tracking-[0.2em] uppercase">DSA Sheet</span>
                    </div>
                </nav>

                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden">
                    {/* Ambient glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] rounded-full opacity-[0.12] blur-[100px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, #6366f1, transparent 70%)' }} />

                    <div className="relative max-w-3xl mx-auto px-5 pt-10 pb-12 text-center">
                        {/* Badges */}
                        <div className="flex items-center justify-center gap-2.5 mb-5">
                            <span className={`px-3 py-1 text-[11px] font-bold rounded-full border ${getDifficultyColor(problem.difficulty)}`}>
                                {problem.difficulty}
                            </span>
                            <span className="px-3 py-1 text-[11px] font-semibold rounded-full border border-white/[0.08] text-white/40 bg-white/[0.04]">
                                {problem.category}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">
                            {problem.name}
                        </h1>
                        <p className="text-white/25 text-sm mb-8">
                            Problem #{problem.id}
                        </p>

                        {/* Complexity chips — horizontal */}
                        <div className="flex items-center justify-center gap-3">
                            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-2">
                                <FaClock className="text-indigo-400/70 text-[10px]" />
                                <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">Time</span>
                                <span className="text-white/90 font-bold text-xs">{problem.timeComplexity}</span>
                            </div>
                            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-4 py-2">
                                <HiChartBar className="text-emerald-400/70 text-[10px]" />
                                <span className="text-white/30 text-[10px] font-semibold uppercase tracking-wider">Space</span>
                                <span className="text-white/90 font-bold text-xs">{problem.spaceComplexity}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content Cards ── */}
                <div className="max-w-2xl mx-auto px-5 pb-16 space-y-3">

                    {/* Description */}
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-center gap-2.5 mb-3">
                            <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                <FaLightbulb className="text-amber-400 text-[10px]" />
                            </div>
                            <h3 className="font-semibold text-white/90 text-sm">About this Problem</h3>
                        </div>
                        <p className="text-white/45 text-[13px] leading-relaxed pl-[34px]">
                            {problem.description}
                        </p>
                    </div>

                    {/* Concepts */}
                    <div className="bg-white/[0.04] border border-white/[0.07] rounded-2xl p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                                <FaCheckCircle className="text-emerald-400 text-[10px]" />
                            </div>
                            <h3 className="font-semibold text-white/90 text-sm">What You'll Learn</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-[34px]">
                            {problem.concepts.map((concept, idx) => (
                                <div key={idx} className="flex items-center gap-2.5 py-2">
                                    <div className="w-1 h-1 rounded-full bg-emerald-400/60 shrink-0" />
                                    <span className="text-white/50 text-[13px]">{concept}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Input & CTA Section ── */}
                    <div className="bg-gradient-to-b from-white/[0.06] to-white/[0.03] border border-white/[0.08] rounded-2xl p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                                <HiSparkles className="text-indigo-400 text-[10px]" />
                            </div>
                            <h3 className="font-semibold text-white/90 text-sm">Custom Input</h3>
                        </div>
                        <div className="pl-[34px] space-y-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customArrayInput}
                                    onChange={handleArrayInputChange}
                                    placeholder={problemName === 'char-replacement' ? 'AABABBAC,2' : '[1, 2, 3, 4, 5]'}
                                    className={`w-full px-4 py-3 bg-black/40 border rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 transition-all placeholder-white/15 ${
                                        arrayError
                                            ? 'border-red-500/40 focus:ring-red-500/20'
                                            : 'border-white/[0.1] focus:ring-indigo-500/30 focus:border-indigo-400/40'
                                    }`}
                                />
                                {customArrayInput !== DEFAULT_ARRAYS[problemName] && (
                                    <button
                                        onClick={() => { setCustomArrayInput(DEFAULT_ARRAYS[problemName]); setArrayError(''); }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 text-[11px] px-2 py-0.5 rounded-md bg-white/[0.06] hover:bg-white/[0.12] transition-all"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>
                            {arrayError ? (
                                <p className="text-red-400/80 text-[11px] flex items-center gap-1.5">
                                    <span>⚠️</span> {arrayError}
                                </p>
                            ) : (
                                <p className="text-white/20 text-[11px]">
                                    {problemName === 'char-replacement'
                                        ? 'Format: LETTERS,k (e.g. AABABBAC,2)'
                                        : 'Comma-separated integers · max 15 elements'}
                                </p>
                            )}

                            {/* Error Display */}
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300/80 text-center text-xs">
                                    {error}
                                </div>
                            )}

                            {/* CTA */}
                            <button
                                onClick={handleVisualize}
                                disabled={!!arrayError}
                                className={`w-full relative group flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-base transition-all duration-200 ${
                                    arrayError
                                        ? 'bg-white/[0.05] text-white/20 cursor-not-allowed'
                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-[0.98]'
                                }`}
                            >
                                <FaPlay className="text-xs" />
                                Visualize
                                {!arrayError && (
                                    <HiSparkles className="text-amber-300/80 text-sm" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center pt-6 pb-4">
                        <p className="text-white/15 text-[11px]">
                            © 2026 EasyLearnova · <Link to="/" className="text-white/25 hover:text-white/50 transition-colors">Home</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default DSAProblemPage;
