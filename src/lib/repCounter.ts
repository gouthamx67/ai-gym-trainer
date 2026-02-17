export type ExerciseState = "down" | "up";

export interface RepCounter {
    count: number;
    state: ExerciseState;
    progress: number; // 0 to 1 for visual feedback
}

/**
 * Logic for a Bicep Curl Rep
 * Handles hysteresis to prevent double counting.
 */
export const updateBicepCurl = (
    currentAngle: number,
    prevState: ExerciseState,
    currentCount: number
): { newState: ExerciseState; newCount: number; progress: number } => {
    let newState = prevState;
    let newCount = currentCount;

    // Calculate progress (visual feedback)
    // Maps 160 degrees (0%) to 30 degrees (100%)
    const rawProgress = (160 - currentAngle) / (160 - 30);
    const progress = Math.min(Math.max(rawProgress, 0), 1);

    if (prevState === "down" && currentAngle < 30) {
        newState = "up";
    } else if (prevState === "up" && currentAngle > 160) {
        newState = "down";
        newCount = currentCount + 1;
    }

    return { newState, newCount, progress };
};
