import { Landmark, calculateAngle } from "./biomechanics";

export type ExerciseState = "down" | "up";

export interface ExerciseResult {
    newState: ExerciseState;
    newCount: number;
    progress: number;
    feedback?: string;
}

export interface FormRule {
    id: string;
    message: string;
    check: (joints: any, angle: number, state: ExerciseState) => boolean;
}

export interface ExerciseConfig {
    id: string;
    name: string;
    type: "angle";
    getAngle: (joints: any) => number;
    thresholds: {
        up: number;
        down: number;
    };
    formRules: FormRule[];
}

/**
 * Exercise Metadata Registry
 */
export const EXERCISES: Record<string, ExerciseConfig> = {
    curl: {
        id: "curl",
        name: "Bicep Curl",
        type: "angle",
        getAngle: (joints) => calculateAngle(joints.rightShoulder, joints.rightElbow, joints.rightWrist),
        thresholds: {
            up: 30,
            down: 160,
        },
        formRules: [
            {
                id: "partial-up",
                message: "Curl higher!",
                check: (joints, angle, state) => state === "down" && angle < 60 && angle > 35,
            },
            {
                id: "partial-down",
                message: "Extend fully!",
                check: (joints, angle, state) => state === "up" && angle > 130 && angle < 155,
            },
        ],
    },
    squat: {
        id: "squat",
        name: "Squat",
        type: "angle",
        getAngle: (joints) => calculateAngle(joints.rightHip, joints.rightKnee, joints.rightAnkle),
        thresholds: {
            up: 90,
            down: 160,
        },
        formRules: [
            {
                id: "depth",
                message: "Go Lower!",
                check: (joints, angle, state) => state === "down" && angle < 115 && angle > 95,
            },
        ],
    },
};

/**
 * Generic Rep Counter Engine
 * Works for any "angle-based" exercise by looking at its specific thresholds.
 */
export const updateExercise = (
    joints: any,
    angle: number,
    prevState: ExerciseState,
    currentCount: number,
    config: ExerciseConfig
): ExerciseResult => {
    let newState = prevState;
    let newCount = currentCount;
    let feedback: string | undefined;

    // Evaluate Form Rules
    const activeRule = config.formRules.find(rule => rule.check(joints, angle, prevState));
    if (activeRule) {
        feedback = activeRule.message;
    }

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

    return { newState, newCount, progress, feedback };
};
