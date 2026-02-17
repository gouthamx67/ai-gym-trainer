/**
 * MediaPipe Pose Landmark Indices
 * 11: Left Shoulder  | 12: Right Shoulder
 * 13: Left Elbow     | 14: Right Elbow
 * 15: Left Wrist     | 16: Right Wrist
 * 23: Left Hip       | 24: Right Hip
 * 25: Left Knee      | 26: Right Knee
 * 27: Left Ankle     | 28: Right Ankle
 */

export interface Landmark {
    x: number;
    y: number;
    z: number;
    visibility: number;
}

export type PoseLandmarks = Landmark[];

/**
 * Extracts specific joints from the landmark array for easier processing.
 * Using a standard object makes the "Angle Engine" much more readable.
 */
export const extractKeyJoints = (landmarks: PoseLandmarks) => {
    if (!landmarks || landmarks.length === 0) return null;

    return {
        leftShoulder: landmarks[11],
        rightShoulder: landmarks[12],
        leftElbow: landmarks[13],
        rightElbow: landmarks[14],
        leftWrist: landmarks[15],
        rightWrist: landmarks[16],
        leftHip: landmarks[23],
        rightHip: landmarks[24],
        leftKnee: landmarks[25],
        rightKnee: landmarks[26],
        leftAnkle: landmarks[27],
        rightAnkle: landmarks[28],
    };
};

/**
 * Normalizes coordinates to pixel values for drawing (if needed).
 * Note: For vector math, we stay in normalized 0-1 space usually.
 */
export const toScreenCoords = (landmark: Landmark, width: number, height: number) => {
    return {
        x: landmark.x * width,
        y: landmark.y * height,
    };
};

/**
 * Calculates the angle between three points (A, B, C) where B is the vertex.
 * Uses the atan2 method for robust 4-quadrant calculation.
 */
export const calculateAngle = (a: Landmark, b: Landmark, c: Landmark): number => {
    const radians =
        Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);

    let angle = Math.abs((radians * 180.0) / Math.PI);

    // We want the interior angle (0-180 usually for gym movements)
    if (angle > 180.0) {
        angle = 360 - angle;
    }

    return Math.round(angle);
};

