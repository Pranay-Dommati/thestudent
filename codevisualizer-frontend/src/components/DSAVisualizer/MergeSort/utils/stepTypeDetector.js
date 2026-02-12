/**
 * Step Type Detection Utility
 * Analyzes code lines to determine the type of merge sort operation
 */

/**
 * Determines the step type from a code line
 * @param {string} code - The code line to analyze
 * @param {object} currentStep - The current step object (may have stepType property)
 * @returns {string} The detected step type
 */
export const getStepType = (code, currentStep) => {
    // Check if the step already has a stepType property (e.g., synthetic init step)
    if (currentStep?.stepType) return currentStep.stepType;

    if (!code) return 'initial';

    // Check for array initialization line first
    if (code.includes('arr = [') && code.includes(']')) return 'init_array';
    if (code.includes('if len(arr)') || code.includes('len(arr) <= 1')) return 'check_base';
    if (code.includes('return arr') && !code.includes('merge')) return 'return_base';
    if (code.includes('mid =') || code.includes('len(arr) //')) return 'compute_mid';
    if (code.includes('left = arr[:mid]')) return 'split_left';
    if (code.includes('right = arr[mid:]')) return 'split_right';
    if (code.includes('left_sorted') && code.includes('merge_sort')) return 'recurse_left';
    if (code.includes('right_sorted') && code.includes('merge_sort')) return 'recurse_right';
    if (code.includes('merge') && code.includes('left_sorted') && code.includes('right_sorted')) return 'call_merge';
    if (code.includes('result = []')) return 'init_result';
    if (code.includes('i = j = 0')) return 'init_pointers';
    if (code.includes('while i < len(left)')) return 'compare_loop';
    if (code.includes('left[i]') && code.includes('right[j]')) return 'compare';
    if (code.includes('result.append(left[i])')) return 'append_left';
    if (code.includes('result.append(right[j])')) return 'append_right';
    if (code.includes('i += 1')) return 'inc_i';
    if (code.includes('j += 1')) return 'inc_j';
    if (code.includes('result.extend(left')) return 'extend_left';
    if (code.includes('result.extend(right')) return 'extend_right';
    if (code.includes('return result')) return 'return_merged';

    return 'other';
};

/**
 * Step type display names and colors
 */
export const stepTypeConfig = {
    init_array: { label: '📊 Creating Initial Array', color: '#4ade80' },
    call_function: { label: '🚀 Calling merge_sort(arr)', color: '#a5b4fc' },
    check_base: { label: '🔍 Checking Base Case', color: '#fbbf24' },
    return_base: { label: '↩️ Base Case: Already Sorted', color: '#a78bfa' },
    compute_mid: { label: '📐 Computing Midpoint', color: '#f472b6' },
    split_left: { label: '✂️ Creating Left Half', color: '#60a5fa' },
    split_right: { label: '✂️ Creating Right Half', color: '#60a5fa' },
    recurse_left: { label: '🔄 Recursively Sorting Left', color: '#60a5fa' },
    recurse_right: { label: '🔄 Recursively Sorting Right', color: '#60a5fa' },
    call_merge: { label: '🔗 Calling Merge', color: '#34d399' },
    init_result: { label: '📦 Initializing Result Array', color: '#34d399' },
    init_pointers: { label: '👆 Setting Up Pointers i=0, j=0', color: '#34d399' },
    compare_loop: { label: '🔄 Comparison Loop', color: '#34d399' },
    compare: { label: '⚖️ Comparing Elements', color: '#34d399' },
    append_left: { label: '➕ Adding Element to Result', color: '#34d399' },
    append_right: { label: '➕ Adding Element to Result', color: '#34d399' },
    inc_i: { label: '👆 Moving Left Pointer (i++)', color: '#34d399' },
    inc_j: { label: '👆 Moving Right Pointer (j++)', color: '#34d399' },
    extend_left: { label: '📤 Adding Remaining Left Elements', color: '#34d399' },
    extend_right: { label: '📤 Adding Remaining Right Elements', color: '#34d399' },
    return_merged: { label: '✅ Returning Merged Result', color: '#a78bfa' },
    initial: { label: '🚀 Ready to Start', color: '#94a3b8' },
    other: { label: '⚡ Processing...', color: '#94a3b8' }
};

export default getStepType;
