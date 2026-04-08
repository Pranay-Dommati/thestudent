import React, { useState, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FaArrowLeft, FaPlay, FaLightbulb, FaClock, FaCheckCircle } from 'react-icons/fa';
import { HiSparkles, HiChartBar, HiBookOpen } from 'react-icons/hi2';
import { DSAImmersiveVisualizer } from '../components/DSAVisualizer';

// ── Floating DSA tokens for the page background ───────────────────────────
const PAGE_TOKENS = [
    'O(log n)', 'O(n²)', 'O(n log n)', 'O(1)', 'O(n)',
    'left = mid+1', 'right = mid-1', 'arr[mid]', 'while l ≤ r',
    'pivot', 'merge()', 'swap(i,j)', 'return mid', 'stack.pop()',
    'BFS', 'DFS', 'Dijkstra', 'DP', 'memoize',
    'f(n-1)+f(n-2)', 'T(n)=2T(n/2)+n', 'base case', 'recurse(n-1)',
    'for i in range(n)', 'two pointer', 'sliding window',
    '[ L · · · R ]', '{ key: val }', 'min_heap', 'max_heap',
    'adj[u].append(v)', 'dp[i][j]', 'prefix sum', 'hash map',
];

const useFrozenTokens = () => useRef(
    PAGE_TOKENS.map((t, i) => ({
        text: t,
        left: `${(i * 41 + 5) % 94}%`,
        top:  `${(i * 67 + 8) % 92}%`,
        delay: `${(i * 0.35) % 7}s`,
        dur:   `${7 + (i % 6)}s`,
        opacity: 0.045 + (i % 5) * 0.015,
        scale:   0.65 + (i % 4) * 0.15,
        rotate:  `${(i % 2 === 0 ? 1 : -1) * (i % 8)}deg`,
    }))
).current;

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

    'valid-parentheses': (inputStr) => {
        const raw = String(inputStr ?? '').trim();
        const stripped = ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
            ? raw.slice(1, -1)
            : raw;
        const s = stripped.replace(/\s+/g, '') || '({[()]})[]';
        return `def is_valid(s):
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}

    for char in s:
        if char in mapping.values():
            stack.append(char)
        else:
            if not stack or stack[-1] != mapping[char]:
                return False
            stack.pop()

    return len(stack) == 0


s = "${s}"
print(is_valid(s))`;
    },

    'first-last-position': (inputStr) => {
        const commaIdx = inputStr.lastIndexOf(',');
        const arrPart = commaIdx >= 0 ? inputStr.slice(0, commaIdx).trim() : '[2, 4, 4, 4, 6, 8, 10]';
        const tgt     = commaIdx >= 0 ? inputStr.slice(commaIdx + 1).trim() : '4';
        return `def find_first(nums, target):
    low = 0
    high = len(nums) - 1
    first = -1

    while low <= high:
        mid = (low + high) // 2

        if nums[mid] < target:
            low = mid + 1

        else:
            if nums[mid] == target:
                first = mid
            high = mid - 1

    return first


def find_last(nums, target):
    low = 0
    high = len(nums) - 1
    last = -1

    while low <= high:
        mid = (low + high) // 2

        if nums[mid] > target:
            high = mid - 1

        else:
            if nums[mid] == target:
                last = mid
            low = mid + 1

    return last


def search_range(nums, target):
    first = find_first(nums, target)
    last = find_last(nums, target)
    return [first, last]


# Example input for visualization
nums = ${arrPart}
target = ${tgt}

result = search_range(nums, target)

print("Range:", result)`;
    },

    'search-rotated-array': (inputStr) => {
        const commaIdx = inputStr.lastIndexOf(',');
        const arrPart = commaIdx >= 0 ? inputStr.slice(0, commaIdx).trim() : '[4, 5, 6, 7, 0, 1, 2]';
        const tgt     = commaIdx >= 0 ? inputStr.slice(commaIdx + 1).trim() : '0';
        return `def search_rotated(nums, target):
    low = 0
    high = len(nums) - 1

    while low <= high:
        mid = low + (high - low) // 2

        if nums[mid] == target:
            return mid

        # Left half is sorted
        if nums[low] <= nums[mid]:

            if nums[low] <= target < nums[mid]:
                high = mid - 1
            else:
                low = mid + 1

        # Right half is sorted
        else:

            if nums[mid] < target <= nums[high]:
                low = mid + 1
            else:
                high = mid - 1

    return -1


nums = ${arrPart}
target = ${tgt}
result = search_rotated(nums, target)
print("Target index:", result)`;
    },

    'find-peak-element': (arrString) => `def findPeakElement(nums):
    left = 0
    right = len(nums) - 1

    while left < right:
        mid = left + (right - left) // 2

        if nums[mid] > nums[mid + 1]:
            right = mid
        else:
            left = mid + 1

    return left


# Example
nums = ${arrString}
peak_index = findPeakElement(nums)

print("Peak index:", peak_index)
print("Peak value:", nums[peak_index])`,

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

    'fibonacci': (inputStr) => {
        const n = parseInt(String(inputStr).trim(), 10) || 5;
        return `def fibonacci(n):
    # base cases
    if n == 0:
        return 0
    if n == 1:
        return 1

    # recursive calls stored in variables
    first = fibonacci(n - 1)
    second = fibonacci(n - 2)

    return first + second

n = ${n}
print(fibonacci(n))`;
    },

    'subsets': (inputStr) => {
        let arr;
        try { arr = JSON.parse(inputStr.trim()); } catch { arr = [1, 2, 3]; }
        if (!Array.isArray(arr)) arr = [1, 2, 3];
        arr = arr.map(Number).filter(n => !isNaN(n)).slice(0, 4);
        if (arr.length === 0) arr = [1, 2, 3];
        return `def subsets(nums):

    result = []
    subset = []

    def backtrack(index):

        # store current subset
        result.append(subset[:])

        for i in range(index, len(nums)):
            subset.append(nums[i])
            backtrack(i + 1)
            subset.pop()

    backtrack(0)
    return result

nums = [${arr.join(', ')}]
print(subsets(nums))`;
    },

    'subsets-2': (inputStr) => {
        let arr;
        try { arr = JSON.parse(inputStr.trim()); } catch { arr = [1, 2, 3, 4]; }
        if (!Array.isArray(arr)) arr = [1, 2, 3, 4];
        arr = arr.map(Number).filter(n => !isNaN(n)).slice(0, 4);
        if (arr.length === 0) arr = [1, 2, 3, 4];
        return `def visualize_subsets(nums):

    result = []
    subset = []

    def dfs(index):

        # record current subset
        result.append(subset.copy())

        for i in range(index, len(nums)):

            # choose
            subset.append(nums[i])

            # explore
            dfs(i + 1)

            # unchoose (backtrack)
            subset.pop()

    dfs(0)
    return result


nums = [${arr.join(', ')}]
print(visualize_subsets(nums))`;
    },

    'remove-nth-from-end': (inputStr) => {
        const commaIdx = inputStr.lastIndexOf(',');
        const arrPart  = commaIdx >= 0 ? inputStr.slice(0, commaIdx).trim() : '[1, 2, 3, 4, 5]';
        let llComment  = '#LL = [1 -> 2 -> 3 -> 4 -> 5]';
        try {
            const vals = JSON.parse(arrPart);
            if (Array.isArray(vals)) llComment = `#LL = [${vals.join(' -> ')}]`;
        } catch {
            // Keep default linked-list comment when parsing fails.
        }
        return `def remove_nth_from_end(head, k):\n\n    # create dummy node before head\n    dummy = ListNode(0)\n    dummy.next = head\n\n    slow = dummy\n    fast = dummy\n\n    # move fast pointer k steps ahead\n    for _ in range(k):\n        fast = fast.next\n\n    # move both pointers until fast reaches last node\n    while fast.next:\n        slow = slow.next\n        fast = fast.next\n\n    # remove the kth node from end\n    slow.next = slow.next.next\n\n    return dummy.next\n\n${llComment}\n\n# class ListNode:\n#     def __init__(self, val=0, next=None):\n#         self.val = val\n#         self.next = next`;
    },
    'linked-list-cycle': (inputStr) => {
        const commaIdx = inputStr.lastIndexOf(',');
        const arrPart  = commaIdx >= 0 ? inputStr.slice(0, commaIdx).trim() : '[1, 2, 3, 4, 5]';
        const posPart  = commaIdx >= 0 ? inputStr.slice(commaIdx + 1).trim() : '2';
        let llComment  = '# LL = [1 -> 2 -> 3 -> 4 -> 5]';
        try {
            const vals = JSON.parse(arrPart);
            if (Array.isArray(vals) && vals.length > 0) {
                llComment = `# LL = [${vals.join(' -> ')}]`;
            }
        } catch {
            // Keep default linked-list comment when parsing fails.
        }
        return `def has_cycle(head: Optional[ListNode]):

    slow = head
    fast = head

    # move slow by 1 and fast by 2
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

        # if both pointers meet → cycle exists
        if slow == fast:
            return True

    # fast reached null → no cycle
    return False

${llComment}
# pos = ${posPart}
# pos represents the index where the tail connects to form a cycle

# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next`;
    },
    'middle-of-linked-list': (inputStr) => {
        const arrPart = (inputStr || '').trim() || '[1, 2, 3, 4, 5]';
        let llComment = '# LL = [1 -> 2 -> 3 -> 4 -> 5]';
        try {
            const vals = JSON.parse(arrPart);
            if (Array.isArray(vals) && vals.length > 0) {
                llComment = `# LL = [${vals.join(' -> ')}]`;
            }
        } catch {
            // Keep default linked-list comment when parsing fails.
        }
        return `def middle_node(head):
    slow = head
    fast = head

    # move slow by 1 and fast by 2
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next

    # slow will be at the middle node
    return slow

${llComment}

# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next`;
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
    'binary-search':         '[3, 12, 18, 25, 31, 42, 63],31',
    'find-peak-element':     '[1, 3, 5, 7, 6, 4, 2]',
    'remove-nth-from-end':   '[1, 2, 3, 4, 5],2',
    'linked-list-cycle':     '[1, 2, 3, 4, 5],2',
    'middle-of-linked-list': '[1, 2, 3, 4, 5]',
    'first-last-position':   '[2, 4, 4, 4, 6, 8, 10],4',
    'search-rotated-array':  '[4, 5, 6, 7, 0, 1, 2],0',
    'fibonacci':             '5',
    'factorial':             '5',
    'subsets':               '[1, 2, 3]',
    'subsets-2':             '[1, 2, 3, 4]',
    'valid-parentheses':     '({[()]})[]',
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
    'find-peak-element': {
        id: 8,
        name: "Find Peak Element",
        difficulty: "Medium",
        category: "Binary Search",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        description: "Given an array where a peak element is one that is greater than its neighbours, find any peak element and return its index. Because the array has virtual -∞ sentinels at both ends, at least one peak always exists. The algorithm uses binary search: if nums[mid] > nums[mid+1], the peak lies in the left half (at or before mid); otherwise it lies in the right half (after mid). The search converges until a single element remains — that element is the peak.",
        concepts: [
            "Binary Search on Unsorted Array",
            "Two-Pointer (L / R) Approach",
            "Gradient / Slope Reasoning",
            "Logarithmic Time Complexity"
        ]
    },
    'first-last-position': {
        id: 10,
        name: "First/Last Position",
        difficulty: "Medium",
        category: "Binary Search",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        description: "Given a sorted array and a target, return the first and last index of the target. If not found, return [-1, -1]. Two binary searches are run: find_first narrows right whenever nums[mid] ≥ target (recording a candidate when equal), and find_last narrows left whenever nums[mid] ≤ target (recording a candidate when equal). Both converge in O(log n).",
        concepts: [
            "Binary Search — Two Passes",
            "Left-biased vs Right-biased Search",
            "Candidate Recording Pattern",
            "Logarithmic Time Complexity"
        ]
    },
    'search-rotated-array': {
        id: 11,
        name: "Search Rotated Array",
        difficulty: "Medium",
        category: "Binary Search",
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        description: "A sorted array has been rotated at an unknown pivot. Given that array and a target, return the target\'s index or -1 if not found. At every mid-point, one half must still be sorted — identify which, check if the target falls inside it, and discard the other half. This keeps the search logarithmic despite the rotation.",
        concepts: [
            "Binary Search on Rotated Array",
            "Sorted-Half Identification",
            "Range Elimination",
            "Logarithmic Time Complexity"
        ]
    },
    'fibonacci': {
        id: 12,
        name: "Fibonacci Tree",
        difficulty: "Easy",
        category: "Recursion",
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n)",
        description: "Compute the nth Fibonacci number using pure recursion. fibonacci(n) calls fibonacci(n-1) and fibonacci(n-2), building a binary call tree before combining results on the way back up. Base cases n=0 and n=1 return immediately, while every other call recurses left then right and returns their sum.",
        concepts: [
            "Recursive Function Calls",
            "Base Case Identification",
            "Call Stack Depth (O(n))",
            "Overlapping Subproblems (intro to memoisation)"
        ]
    },
    'subsets': {
        id: 12,
        name: "Subsets",
        difficulty: "Medium",
        category: "Recursion",
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n)",
        description: "Given an integer array nums, return all possible subsets. The solution uses backtracking: at each call the current subset is immediately recorded, then each remaining element is chosen and the function recurses deeper; after returning the element is removed (backtracked). This builds a call tree where every node corresponds to a valid subset.",
        concepts: [
            "Backtracking Pattern",
            "Recursive Call Tree",
            "Subset / Power Set Enumeration",
            "Choose → Explore → Unchoose"
        ]
    },
    'subsets-2': {
        id: 13,
        name: "Subsets 2",
        difficulty: "Medium",
        category: "Recursion",
        timeComplexity: "O(2ⁿ)",
        spaceComplexity: "O(n)",
        description: "Generate all subsets with a DFS/backtracking traversal. At each call, record the current subset, then iterate remaining positions, choose an element, recurse, and unchoose to backtrack.",
        concepts: [
            "Backtracking Pattern",
            "Depth-First Search",
            "Subset Enumeration",
            "Choose → Explore → Unchoose"
        ]
    },
    'valid-parentheses': {
        id: 14,
        name: "Valid Parentheses",
        difficulty: "Easy",
        category: "Stack",
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        description: "Given a string of brackets, determine if it is valid. Use a stack to push opening brackets and for every closing bracket verify it matches the most recent opening bracket. If a mismatch occurs or the stack is not empty at the end, the string is invalid.",
        concepts: [
            "Stack (LIFO)",
            "Bracket Matching",
            "Push / Pop Operations",
            "Early Mismatch Detection"
        ]
    },
    'remove-nth-from-end': {
        id: 9,
        name: "Remove Nth Node From End",
        difficulty: "Medium",
        category: "Slow & Fast Pointer",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        description: "Given the head of a linked list and integer n, remove the nth node from the end and return the head. A dummy sentinel node and two pointers n steps apart traverse together until the fast pointer reaches the tail \u2014 the slow pointer then sits just before the target node.",
        concepts: [
            "Slow & Fast Pointer Technique",
            "Dummy / Sentinel Node",
            "Linked List Traversal",
            "Two-Pass Reduction to One-Pass"
        ]
    },
    'linked-list-cycle': {
        id: 20,
        name: "Linked List Cycle",
        difficulty: "Easy",
        category: "Slow & Fast Pointer",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        description: "Given head of a linked list, determine whether the list has a cycle. Floyd's slow and fast pointers move at different speeds; if they ever meet, a cycle exists. If fast reaches null, the list is acyclic.",
        concepts: [
            "Floyd's Tortoise & Hare",
            "Slow & Fast Pointer Technique",
            "Cycle Detection",
            "Constant Extra Space"
        ]
    },
    'middle-of-linked-list': {
        id: 21,
        name: "Middle of Linked List",
        difficulty: "Easy",
        category: "Slow & Fast Pointer",
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        description: "Given the head of a singly linked list, return the middle node. Slow moves one step while fast moves two; when fast reaches the end, slow is at the middle. For even length, the second middle is returned.",
        concepts: [
            "Slow & Fast Pointer Technique",
            "Single Pass Linked List Traversal",
            "Middle Node Detection",
            "Constant Extra Space"
        ]
    },
};

// Problems whose visualizers are fully self-contained (no backend trace needed)
const SELF_CONTAINED_VISUALIZERS = new Set([
    'bubble-sort', 'selection-sort', 'insertion-sort', 'merge-sort', 'quick-sort',
    'binary-search', 'find-peak-element', 'char-replacement',
    'remove-nth-from-end', 'first-last-position', 'search-rotated-array',
    'linked-list-cycle', 'middle-of-linked-list',
    'fibonacci', 'factorial', 'subsets', 'subsets-2', 'valid-parentheses',
]);

const DSAProblemPage = () => {
    const { problemName } = useParams();
    const problem = problemsData[problemName];

    // ── Split input state per problem type ────────────────────────────────
    // For binary-search: arrField=[...], targetField=number
    // For char-replacement: arrField=LETTERS, targetField=k
    // For sorting: arrField=[...] only
    const getDefaultArr = () => {
        if (problemName === 'binary-search') return '[3, 12, 18, 25, 31, 42, 63]';
        if (problemName === 'first-last-position') return '[2, 4, 4, 4, 6, 8, 10]';
        if (problemName === 'search-rotated-array') return '[4, 5, 6, 7, 0, 1, 2]';
        if (problemName === 'char-replacement') return 'AABABBAC';
        if (problemName === 'remove-nth-from-end') return '[1, 2, 3, 4, 5]';
        if (problemName === 'linked-list-cycle') return '[1, 2, 3, 4, 5]';
        if (problemName === 'middle-of-linked-list') return '[1, 2, 3, 4, 5]';
        if (problemName === 'fibonacci') return '5';
        if (problemName === 'factorial') return '5';
        if (problemName === 'subsets') return '[1, 2, 3]';
        if (problemName === 'subsets-2') return '[1, 2, 3, 4]';
        if (problemName === 'valid-parentheses') return '({[()]})[]';
        return DEFAULT_ARRAYS[problemName] || '[38, 27, 43, 3, 9, 82, 10]';
    };
    const getDefaultTarget = () => {
        if (problemName === 'binary-search') return '31';
        if (problemName === 'first-last-position') return '4';
        if (problemName === 'search-rotated-array') return '0';
        if (problemName === 'char-replacement') return '2';
        if (problemName === 'remove-nth-from-end') return '2';
        if (problemName === 'linked-list-cycle') return '2';
        if (problemName === 'fibonacci') return '';
        if (problemName === 'subsets') return '';
        if (problemName === 'subsets-2') return '';
        if (problemName === 'valid-parentheses') return '';
        return '';
    };

    const [arrField, setArrField]       = useState(getDefaultArr);
    const [targetField, setTargetField] = useState(getDefaultTarget);
    const [arrError, setArrError]       = useState('');
    const [targetError, setTargetError] = useState('');

    // Frozen tokens for the 3-D background layer
    const pageTokens = useFrozenTokens();

    // Combine fields into the single string the templates expect
    const customArrayInput = (() => {
        if (problemName === 'binary-search')        return `${arrField},${targetField}`;
        if (problemName === 'first-last-position')  return `${arrField},${targetField}`;
        if (problemName === 'search-rotated-array') return `${arrField},${targetField}`;
        if (problemName === 'char-replacement')     return `${arrField},${targetField}`;
        if (problemName === 'remove-nth-from-end') return `${arrField},${targetField}`;
        if (problemName === 'linked-list-cycle') return `${arrField},${targetField}`;
        if (problemName === 'fibonacci')            return arrField;
        if (problemName === 'factorial')            return arrField;
        if (problemName === 'subsets')              return arrField;
        if (problemName === 'subsets-2')            return arrField;
        if (problemName === 'valid-parentheses')    return arrField;
        return arrField;
    })();

    const arrayError = arrError || targetError;

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
    // ── Per-field validators ─────────────────────────────────────────────────
    const validateArr = (val) => {
        if (problemName === 'fibonacci') {
            const v = parseInt(val.trim(), 10);
            if (isNaN(v) || v < 1) return 'Must be a positive integer';
            if (v > 7) return 'Max n = 7 (tree gets too large)';
            return '';
        }
        if (problemName === 'factorial') {
            const v = parseInt(val.trim(), 10);
            if (isNaN(v) || v < 1) return 'Must be a positive integer';
            if (v > 8) return 'Max n = 8 (chain gets too long)';
            return '';
        }
        if (problemName === 'subsets' || problemName === 'subsets-2') {
            const t = val.trim();
            if (!t.startsWith('[') || !t.endsWith(']')) return 'Must be like [1, 2, 3]';
            const inner = t.slice(1, -1).trim();
            if (!inner) return 'Array cannot be empty';
            const parts = inner.split(',').map(p => p.trim());
            for (const p of parts) { if (!/^-?\d+$/.test(p)) return `Invalid number: ${p}`; }
            if (parts.length > 4) return 'Max 4 elements (tree gets too large)';
            return '';
        }
        if (problemName === 'valid-parentheses') {
            const t = val.trim();
            if (!t) return 'Input cannot be empty';
            const compact = t.replace(/\s+/g, '').replace(/^['"]|['"]$/g, '');
            if (!compact) return 'Input cannot be empty';
            if (!/^[()[\]{}]+$/.test(compact)) return 'Use brackets only: () {} []';
            if (compact.length > 40) return 'Max 40 characters';
            return '';
        }
        if (problemName === 'char-replacement') {
            if (!/^[A-Za-z]+$/.test(val.trim())) return 'Letters only (e.g. AABABBAC)';
            if (val.trim().length > 20) return 'Max 20 characters';
            return '';
        }
        const t = val.trim();
        if (!t.startsWith('[') || !t.endsWith(']')) return 'Must be like [1, 2, 3]';
        const inner = t.slice(1, -1).trim();
        if (!inner) return 'Array cannot be empty';
        const parts = inner.split(',').map(p => p.trim());
        for (const p of parts) { if (!/^-?\d+$/.test(p)) return `Invalid number: ${p}`; }
        if (parts.length > 15) return 'Max 15 elements';
        return '';
    };
    const validateTarget = (val) => {
        if (problemName === 'fibonacci') return '';
        if (problemName === 'binary-search' || problemName === 'first-last-position' || problemName === 'search-rotated-array') {
            if (!/^-?\d+$/.test(val.trim())) return 'Must be an integer';
            return '';
        }
        if (problemName === 'char-replacement') {
            if (!/^\d+$/.test(val.trim())) return 'Must be a number ≥ 0';
            return '';
        }
        if (problemName === 'remove-nth-from-end') {
            if (!/^\d+$/.test(val.trim()) || parseInt(val.trim(), 10) < 1) return 'Must be a positive integer';
            return '';
        }
        if (problemName === 'linked-list-cycle') {
            if (!/^-?\d+$/.test(val.trim())) return 'Must be -1 or an index (0-based)';
            return '';
        }
        return '';
    };

    const handleArrChange = (e) => { setArrField(e.target.value); setArrError(validateArr(e.target.value)); };
    const handleTargetChange = (e) => { setTargetField(e.target.value); setTargetError(validateTarget(e.target.value)); };

    // Handle rerun with a specific array (called from visualizer)
    const handleRerunWithArray = useCallback(async (newArrayString) => {
        // update arrField only (keep existing target)
        if (problemName === 'fibonacci' || problemName === 'factorial' || problemName === 'subsets' || problemName === 'subsets-2') {
            setArrField(newArrayString);
        } else if (problemName === 'binary-search' || problemName === 'first-last-position' || problemName === 'search-rotated-array') {
            const commaIdx = newArrayString.lastIndexOf(',');
            if (commaIdx >= 0) {
                setArrField(newArrayString.slice(0, commaIdx).trim());
                setTargetField(newArrayString.slice(commaIdx + 1).trim());
            } else {
                setArrField(newArrayString);
            }
        } else if (problemName === 'char-replacement') {
            const parts = newArrayString.split(',');
            setArrField(parts[0]?.trim() || newArrayString);
            if (parts[1]) setTargetField(parts[1].trim());
        } else if (problemName === 'remove-nth-from-end') {
            const commaIdx = newArrayString.lastIndexOf(',');
            if (commaIdx >= 0) {
                setArrField(newArrayString.slice(0, commaIdx).trim());
                setTargetField(newArrayString.slice(commaIdx + 1).trim());
            } else {
                setArrField(newArrayString);
            }
        } else if (problemName === 'linked-list-cycle') {
            const commaIdx = newArrayString.lastIndexOf(',');
            if (commaIdx >= 0) {
                setArrField(newArrayString.slice(0, commaIdx).trim());
                setTargetField(newArrayString.slice(commaIdx + 1).trim());
            } else {
                setArrField(newArrayString);
            }
        } else {
            setArrField(newArrayString);
        }
        setShowVisualizer(true);
        setIsLoadingTrace(false);
        setSteps([]);
        setExecutionId(null);
        setError(null);

        // Self-contained visualizers don't need a backend trace — open immediately
        if (SELF_CONTAINED_VISUALIZERS.has(problemName)) return;

        setIsLoadingTrace(true);

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

    // Problems whose visualizers are fully self-contained (no backend trace needed)
    // (constant lives at module scope — see above)

    // Run the trace (same logic as CodeVisualizerPage)
    const handleVisualize = useCallback(async () => {
        setShowVisualizer(true);
        setIsLoadingTrace(false);
        setSteps([]);
        setExecutionId(null);
        setError(null);

        // Self-contained visualizers don't need a backend trace — open immediately
        if (SELF_CONTAINED_VISUALIZERS.has(problemName)) return;

        setIsLoadingTrace(true);

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
            <div className="relative min-h-screen bg-slate-900 overflow-hidden">

                {/* ── Full-page 3-D floating token layer ── */}
                <style>{`
                    @keyframes dsaFloat {
                        0%   { transform: translateY(0px) translateZ(0px) rotate(var(--r)); opacity: var(--o); }
                        33%  { transform: translateY(-14px) translateZ(20px) rotate(var(--r)); opacity: calc(var(--o) * 1.6); }
                        66%  { transform: translateY(-6px) translateZ(-10px) rotate(var(--r)); opacity: calc(var(--o) * 0.8); }
                        100% { transform: translateY(0px) translateZ(0px) rotate(var(--r)); opacity: var(--o); }
                    }
                `}</style>
                {pageTokens.map((tk, i) => (
                    <div
                        key={i}
                        className="absolute font-mono font-semibold select-none pointer-events-none text-indigo-300"
                        style={{
                            left: tk.left, top: tk.top,
                            fontSize: `${9 * tk.scale}px`,
                            '--o': tk.opacity, '--r': tk.rotate,
                            opacity: tk.opacity,
                            animation: `dsaFloat ${tk.dur} ${tk.delay} ease-in-out infinite`,
                            zIndex: 0,
                        }}
                    >{tk.text}</div>
                ))}

                {/* subtle grid overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: 'linear-gradient(rgba(99,102,241,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.04) 1px,transparent 1px)',
                    backgroundSize: '44px 44px',
                    maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%)'
                }} />

                {/* soft indigo glow top-center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[260px] rounded-full opacity-[0.1] blur-[90px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, #6366f1, transparent 70%)' }} />

                {/* ── Compact Top Bar ── */}
                <nav className="relative z-20 sticky top-0 bg-slate-900/90 backdrop-blur-sm border-b border-white/[0.06]">
                    <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
                        <Link to="/" className="group flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-sm">
                            <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
                            Home
                        </Link>
                        <span className="text-white/20 text-[10px] font-semibold tracking-[0.2em] uppercase">DSA Sheet</span>
                    </div>
                </nav>

                {/* ── Hero Banner ── */}
                <div className="relative z-10">

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
                        <div className="flex items-center justify-center gap-3 mb-8">
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

                        {/* ── Input fields + Visualize CTA ── */}
                        <div className="max-w-xl mx-auto w-full">
                            {/* Input row */}
                            <div className="flex flex-col sm:flex-row items-end gap-3 mb-3">

                                {/* Primary field: Array or String */}
                                <div className="flex-1 w-full text-left">
                                    <label className="block text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                                        {(problemName === 'char-replacement' || problemName === 'valid-parentheses') ? 'String' : (problemName === 'fibonacci' || problemName === 'factorial') ? 'n' : 'Array'}
                                    </label>
                                    <input
                                        type="text"
                                        value={arrField}
                                        onChange={handleArrChange}
                                        placeholder={problemName === 'char-replacement' ? 'AABABBAC' : problemName === 'valid-parentheses' ? '({[()]})[]' : (problemName === 'fibonacci' || problemName === 'factorial') ? '5' : '[5, 1, 4, 2, 8]'}
                                        className={`w-full px-4 py-3 bg-white/[0.06] border rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 transition-all placeholder-white/20 ${
                                            arrError ? 'border-red-500/40 focus:ring-red-500/20' : 'border-white/[0.1] focus:ring-indigo-500/30 focus:border-indigo-400/40'
                                        }`}
                                    />
                                    {arrError && <p className="text-red-400/80 text-[10px] mt-1">⚠ {arrError}</p>}
                                </div>

                                {/* Secondary field: Target / k / n */}
                                {(problemName === 'binary-search' || problemName === 'first-last-position' || problemName === 'search-rotated-array' || problemName === 'char-replacement' || problemName === 'remove-nth-from-end' || problemName === 'linked-list-cycle') && (
                                    <div className="w-24 sm:w-28 shrink-0 text-left">
                                        <label className="block text-white/35 text-[10px] font-semibold uppercase tracking-widest mb-1.5">
                                            {(problemName === 'binary-search' || problemName === 'first-last-position' || problemName === 'search-rotated-array') ? 'Target' : problemName === 'linked-list-cycle' ? 'Pos' : problemName === 'remove-nth-from-end' ? 'n' : 'k'}
                                        </label>
                                        <input
                                            type="text"
                                            value={targetField}
                                            onChange={handleTargetChange}
                                            placeholder={problemName === 'binary-search' ? '31' : problemName === 'first-last-position' ? '4' : problemName === 'search-rotated-array' ? '0' : problemName === 'linked-list-cycle' ? '2' : '2'}
                                            className={`w-full px-4 py-3 bg-white/[0.06] border rounded-xl text-white font-mono text-sm focus:outline-none focus:ring-2 transition-all placeholder-white/20 ${
                                                targetError ? 'border-red-500/40 focus:ring-red-500/20' : 'border-white/[0.1] focus:ring-indigo-500/30 focus:border-indigo-400/40'
                                            }`}
                                        />
                                        {targetError && <p className="text-red-400/80 text-[10px] mt-1">⚠ {targetError}</p>}
                                    </div>
                                )}

                                {/* Visualize button */}
                                <button
                                    onClick={handleVisualize}
                                    disabled={!!arrayError}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shrink-0 ${
                                        arrayError
                                            ? 'bg-white/[0.05] text-white/20 cursor-not-allowed'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 active:scale-[0.97]'
                                    }`}
                                >
                                    <FaPlay className="text-[10px]" />
                                    Visualize
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Content Cards ── */}
                <div className="relative z-10 max-w-2xl mx-auto px-5 pb-16 space-y-3">

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

                    {/* Error Display */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300/80 text-center text-xs">
                            {error}
                        </div>
                    )}


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
