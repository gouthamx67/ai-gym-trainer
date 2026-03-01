import { Landmark, calculateAngle } from "./biomechanics";

export type ExerciseState = "down" | "up";

export interface ExerciseResult {
    newState: ExerciseState;
    newCount: number;
    progress: number;
    feedback?: string;
}

export interface ExerciseConfig {
    id: string;
    name: string;
    type: "angle"; // For now we only support angle-based, can add 'distance' later
    getAngle: (joints: any) => number;
    thresholds: {
        up: number;
        down: number;
    };
}

/**
 * Exercise Metadata Registry
 * This is production-level architecture: separating the logic of WHAT an exercise is
 * from the engine that detects it.
 */
export const EXERCISES: Record<string, ExerciseConfig> = {
    curl: {
        id: "curl",
        name: "Bicep Curl",
        type: "angle",
        getAngle: (joints) => calculateAngle(joints.rightShoulder, joints.rightElbow, joints.rightWrist),
        thresholds: {
            up: 30,    // Fully curled
            down: 160, // Fully extended
        },
    },
    squat: {
        id: "squat",
        name: "Squat",
        type: "angle",
        getAngle: (joints) => calculateAngle(joints.rightHip, joints.rightKnee, joints.rightAnkle),
        thresholds: {
            up: 90,    // Thighs parallel to floor
            down: 160, // Standing up
        },
    },
};

/**
 * Generic Rep Counter Engine
 * Works for any "angle-based" exercise by looking at its specific thresholds.
 */
export const updateExercise = (
    angle: number,
    prevState: ExerciseState,
    currentCount: number,
    config: ExerciseConfig
): ExerciseResult => {
    let newState = prevState;
    let newCount = currentCount;

    // Calculate progress: mapping current angle between the two thresholds
    const { up, down } = config.thresholds;

    // Progress logic depends on if the "up" position is a smaller or larger angle
    const range = Math.abs(down - up);
    const currentDiff = Math.abs(down - angle);
    const progress = Math.min(Math.max(currentDiff / range, 0), 1);

    // State Machine logic
    if (down > up) {
        // Standard (like curl): small angle is "UP", large angle is "DOWN"
        if (prevState === "down" && angle < up) {
            newState = "up";
        } else if (prevState === "up" && angle > down) {
            newState = "down";
            newCount = currentCount + 1;
        }
    } else {
        // Reverse: large angle is "UP", small angle is "DOWN"
        if (prevState === "down" && angle > up) {
            newState = "up";
        } else if (prevState === "up" && angle < down) {
            newState = "down";
            newCount = currentCount + 1;
        }
    }

    return { newState, newCount, progress };
};
