import {Easing, interpolate, spring} from 'remotion';

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.65, 0, 0.35, 1);
export const CLAMP = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

export const ramp = (f: number, a: number, b: number, from: number, to: number, easing = EASE_OUT) =>
	interpolate(f, [a, b], [from, to], {...CLAMP, easing});

// POP = spring{damping 11, stiffness 190, mass .6}
export const pop = (frame: number, fps: number, at = 0) =>
	spring({frame: frame - at, fps, config: {damping: 11, stiffness: 190, mass: 0.6}});

// deterministic pseudo random
export const rand = (seed: number) => {
	const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
	return x - Math.floor(x);
};
