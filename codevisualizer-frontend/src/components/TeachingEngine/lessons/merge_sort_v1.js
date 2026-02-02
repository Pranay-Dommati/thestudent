/**
 * Merge Sort Teaching Plan v1.1
 * 
 * Canonical example: [38, 27, 43, 3, 9, 82, 10]
 * 
 * Improved narrations: Teacher-like, calm, intentional
 * Each step explains the "why" not just the "what"
 */

const mergeSortLesson = {
    meta: {
        id: 'merge_sort_v1',
        title: 'Merge Sort',
        version: 1.1,
        description: 'Divide and conquer sorting algorithm'
    },

    initialState: {
        elements: [38, 27, 43, 3, 9, 82, 10]
    },

    timeline: [
        // STEP 1: Introduction - Set the stage
        {
            id: 'step_1',
            narration: {
                text: "Welcome! Today we'll learn Merge Sort — one of the most elegant sorting algorithms. Let's start with this unsorted array of 7 numbers.",
                delay: 0
            },
            visuals: [
                {
                    type: 'SHOW_ARRAY',
                    id: 'array_root',
                    data: [38, 27, 43, 3, 9, 82, 10],
                    position: { x: 0, y: 0 },
                    label: 'Our unsorted array',
                    delay: 0
                }
            ]
        },

        // STEP 2: Explain the core idea
        {
            id: 'step_2',
            narration: {
                text: "Here's the key insight: It's hard to sort 7 numbers at once. But what if we keep breaking the problem into smaller pieces? That's the 'Divide and Conquer' strategy.",
                delay: 0
            },
            visuals: [
                {
                    type: 'HIGHLIGHT',
                    id: 'highlight_root',
                    targetId: 'array_root',
                    delay: 0
                }
            ]
        },

        // STEP 3: First split
        {
            id: 'step_3',
            narration: {
                text: "Step 1: We divide the array in half. The left side gets [38, 27, 43] and the right side gets [3, 9, 82, 10]. Neither is sorted yet.",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_root',
                    leftId: 'array_L1',
                    leftData: [38, 27, 43],
                    rightId: 'array_R1',
                    rightData: [3, 9, 82, 10],
                    position: { y: 1 },
                    delay: 400
                }
            ]
        },

        // STEP 4: Split left half
        {
            id: 'step_4',
            narration: {
                text: "Let's focus on the left side first. We split [38, 27, 43] again. Now we have [38] alone, and [27, 43] together.",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_L1',
                    leftId: 'array_L2a',
                    leftData: [38],
                    rightId: 'array_L2b',
                    rightData: [27, 43],
                    position: { y: 2 },
                    delay: 400
                }
            ]
        },

        // STEP 5: Split [27, 43]
        {
            id: 'step_5',
            narration: {
                text: "We split [27, 43] into individual elements: [27] and [43]. Notice something important — a single element is already sorted by definition!",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_L2b',
                    leftId: 'array_L3a',
                    leftData: [27],
                    rightId: 'array_L3b',
                    rightData: [43],
                    position: { y: 3 },
                    delay: 400
                }
            ]
        },

        // STEP 6: Split right half
        {
            id: 'step_6',
            narration: {
                text: "Now let's apply the same logic to the right side. We split [3, 9, 82, 10] into [3, 9] and [82, 10].",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_R1',
                    leftId: 'array_R2a',
                    leftData: [3, 9],
                    rightId: 'array_R2b',
                    rightData: [82, 10],
                    position: { y: 2 },
                    delay: 400
                }
            ]
        },

        // STEP 7: Split [3, 9]
        {
            id: 'step_7',
            narration: {
                text: "Split [3, 9] into [3] and [9]. Each is now a single element.",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_R2a',
                    leftId: 'array_R3a',
                    leftData: [3],
                    rightId: 'array_R3b',
                    rightData: [9],
                    position: { y: 3 },
                    delay: 400
                }
            ]
        },

        // STEP 8: Split [82, 10]
        {
            id: 'step_8',
            narration: {
                text: "And split [82, 10] into [82] and [10]. Now every piece is a single element. This is the base case of our recursion.",
                delay: 0
            },
            visuals: [
                {
                    type: 'SPLIT',
                    sourceId: 'array_R2b',
                    leftId: 'array_R3c',
                    leftData: [82],
                    rightId: 'array_R3d',
                    rightData: [10],
                    position: { y: 3 },
                    delay: 400
                }
            ]
        },

        // STEP 9: Explain merge phase
        {
            id: 'step_9',
            narration: {
                text: "The dividing is done! Now comes the magic: we merge these pieces back together, but in sorted order. Watch how we compare and combine.",
                delay: 0
            },
            visuals: [
                {
                    type: 'HIGHLIGHT_ALL_LEAVES',
                    id: 'highlight_leaves',
                    delay: 0
                }
            ]
        },

        // STEP 10: Merge [27] and [43]
        {
            id: 'step_10',
            narration: {
                text: "Merge [27] and [43]: We compare them — 27 is smaller, so it goes first. Result: [27, 43]. This pair is now sorted!",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'array_L3a',
                    rightSourceId: 'array_L3b',
                    resultId: 'merged_L2b',
                    resultData: [27, 43],
                    position: { y: 4 },
                    delay: 400
                }
            ]
        },

        // STEP 11: Merge [38] and [27, 43]
        {
            id: 'step_11',
            narration: {
                text: "Now merge [38] with [27, 43]. Compare: 27 < 38, so 27 goes first. Then 38 < 43, so 38 is next. Finally 43. Result: [27, 38, 43].",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'array_L2a',
                    rightSourceId: 'merged_L2b',
                    resultId: 'merged_L1',
                    resultData: [27, 38, 43],
                    position: { y: 5 },
                    delay: 400
                }
            ]
        },

        // STEP 12: Merge [3] and [9]
        {
            id: 'step_12',
            narration: {
                text: "On the right side: Merge [3] and [9]. 3 < 9, so result is [3, 9]. Simple!",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'array_R3a',
                    rightSourceId: 'array_R3b',
                    resultId: 'merged_R2a',
                    resultData: [3, 9],
                    position: { y: 4 },
                    delay: 400
                }
            ]
        },

        // STEP 13: Merge [82] and [10]
        {
            id: 'step_13',
            narration: {
                text: "Merge [82] and [10]. Here 10 < 82, so 10 goes first. Result: [10, 82]. See how the smaller number always goes first?",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'array_R3c',
                    rightSourceId: 'array_R3d',
                    resultId: 'merged_R2b',
                    resultData: [10, 82],
                    position: { y: 4 },
                    delay: 400
                }
            ]
        },

        // STEP 14: Merge [3, 9] and [10, 82]
        {
            id: 'step_14',
            narration: {
                text: "Merge [3, 9] and [10, 82]. Compare step by step: 3 first, then 9, then 10, then 82. Result: [3, 9, 10, 82].",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'merged_R2a',
                    rightSourceId: 'merged_R2b',
                    resultId: 'merged_R1',
                    resultData: [3, 9, 10, 82],
                    position: { y: 5 },
                    delay: 400
                }
            ]
        },

        // STEP 15: Final merge
        {
            id: 'step_15',
            narration: {
                text: "The final merge! Combine [27, 38, 43] and [3, 9, 10, 82]. We walk through both arrays, always picking the smaller element next.",
                delay: 0
            },
            visuals: [
                {
                    type: 'MERGE',
                    leftSourceId: 'merged_L1',
                    rightSourceId: 'merged_R1',
                    resultId: 'array_final',
                    resultData: [3, 9, 10, 27, 38, 43, 82],
                    position: { y: 6 },
                    isFinal: true,
                    delay: 400
                }
            ]
        },

        // STEP 16: Conclusion
        {
            id: 'step_16',
            narration: {
                text: "And we're done! Our array is now perfectly sorted: [3, 9, 10, 27, 38, 43, 82]. Merge Sort guarantees O(n log n) time — efficient even for large datasets. Congratulations, you've learned Merge Sort!",
                delay: 0
            },
            visuals: [
                {
                    type: 'HIGHLIGHT',
                    id: 'highlight_final',
                    targetId: 'array_final',
                    style: 'success',
                    delay: 0
                }
            ]
        }
    ]
};

export default mergeSortLesson;
