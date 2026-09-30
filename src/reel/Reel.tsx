import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CLAMP, EASE_IN_OUT, EASE_OUT} from '../shared/easing';
import track from './track.json';

// Preview cut: virtual set + virtual camera + grade. Captions/kinetic type come once the transcript exists.
export const FPS = 30;
export const REEL_FRAMES = 422;

type Framing = 'wide' | 'medium' | 'close';
// Source is 1080x1920, so every zoom >1 is an upscale: kept modest on purpose.
const ZOOM: Record<Framing, number> = {wide: 1.0, medium: 1.3, close: 1.55};
type Shot = {start: number; end: number; framing: Framing; enter: 'cut' | 'punch' | 'punch2f' | 'zoom_out'; dur: number};
// Boundaries sit in speech pauses found in the audio.
export const SHOTS: Shot[] = [
	{start: 0, end: 2.0, framing: 'wide', enter: 'zoom_out', dur: 0.5},
	{start: 2.0, end: 4.1, framing: 'medium', enter: 'punch', dur: 0.2},
	{start: 4.1, end: 8.2, framing: 'wide', enter: 'zoom_out', dur: 0.6},
	{start: 8.2, end: 11.5, framing: 'close', enter: 'punch2f', dur: 2 / FPS},
	{start: 11.5, end: 14.1, framing: 'medium', enter: 'zoom_out', dur: 0.4},
];
const FLASH_AT = 8.2; // matte flash, the one signature transition in 14s

const cameraScale = (t: number) => {
	const i = SHOTS.findIndex((s) => t >= s.start && t < s.end);
	const s = SHOTS[Math.max(i, 0)];
	const prev = i > 0 ? ZOOM[SHOTS[i - 1].framing] : s.enter === 'zoom_out' ? ZOOM[s.framing] * 1.25 : ZOOM[s.framing];
	const target = ZOOM[s.framing];
	const ease = s.enter === 'zoom_out' ? EASE_IN_OUT : EASE_OUT;
	const base = interpolate(t, [s.start, s.start + s.dur], [prev, target], {...CLAMP, easing: ease});
	// holds >3s creep +2-3%
	const creep = s.end - s.start > 3 ? interpolate(t, [s.start + s.dur, s.end], [0, 0.03 * target], CLAMP) : 0;
	return base + creep;
};

const ORIGIN = '560px 700px'; // chest/face anchor in the 1080x1920 world

export const Reel: React.FC = () => {
	const frame = useCurrentFrame();
	const t = frame / FPS;
	const [dx, dy, rot, sc] = (track as number[][])[Math.min(frame, track.length - 1)];
	const k = cameraScale(t);
	const fg = staticFile(`fg/${String(frame + 1).padStart(5, '0')}.png`);
	const flash = frame >= Math.round(FLASH_AT * FPS) && frame < Math.round(FLASH_AT * FPS) + 2;

	return (
		<AbsoluteFill style={{background: '#02080b'}}>
			{/* world-locked camera group */}
			<AbsoluteFill style={{transform: `scale(${k})`, transformOrigin: ORIGIN}}>
				{/* plate follows the phone's handheld shake so the subject doesn't float */}
				<AbsoluteFill style={{transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${1.08 * sc})`, transformOrigin: '540px 960px'}}>
					<Img src={staticFile('plate_blur.png')} style={{width: '100%', height: '100%', filter: 'brightness(1.15)'}} />
				</AbsoluteFill>
				<AbsoluteFill>
					<Img src={fg} style={{width: '100%', height: '100%', filter: flash ? 'brightness(0) invert(1)' : undefined}} />
				</AbsoluteFill>
			</AbsoluteFill>

			{/* grade: teal/orange unify, vignette 15%, grain 3% */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(11,34,48,0.18), rgba(11,34,48,0) 45%, rgba(11,34,48,0.22))', mixBlendMode: 'multiply'}} />
			<AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.15) 80%, rgba(0,0,0,0.35) 100%)'}} />
			<AbsoluteFill style={{opacity: 0.03 * 3, mixBlendMode: 'overlay'}}>
				<Img src={staticFile(`grain/${frame % 6}.png`)} style={{width: '100%', height: '100%'}} />
			</AbsoluteFill>

			<Audio src={staticFile('audio_norm.wav')} />
		</AbsoluteFill>
	);
};
