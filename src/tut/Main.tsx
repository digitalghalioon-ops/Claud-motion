import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {loadFonts} from '../shared/fonts';
import {CLAMP} from '../shared/easing';
import {GradeOverlay, Paper} from '../styles/A/parts';
import {SAFE, TEMPLATES} from './scenes';

loadFonts();

// AI product-ad tutorial reel. No VO baked in (added manually later), music kept low.
export const TUT_FPS = 30;
export const TUT_SCENES = [
	{template: 'HOOK', from: 0, to: 105},
	{template: 'CAMERA', from: 105, to: 300},
	{template: 'CHATGPT', from: 300, to: 495},
	{template: 'FLOW', from: 495, to: 735},
	{template: 'RESULT', from: 735, to: 1030},
	{template: 'CTA', from: 1030, to: 1200},
];
export const TUT_DURATION = 1200;

const long = (c: number) => [c - 9, c - 6, c - 3, c - 2, c - 1];
const short = (c: number) => [c - 4, c - 1];
const INVERT = new Set<number>([...long(105), ...short(300), ...short(495), ...long(1030)]);
const T2_OUT = new Set(['FLOW']);
const T2_IN = new Set(['CHATGPT', 'CTA']);

const Shell: React.FC<{i: number; dur: number; tIn: boolean; tOut: boolean; children: React.ReactNode}> = ({i, dur, tIn, tOut, children}) => {
	const f = useCurrentFrame();
	const s = i % 2 === 0 ? interpolate(f, [0, dur], [1, 1.03], CLAMP) : interpolate(f, [0, dur], [1.03, 1], CLAMP);
	let blur = 0;
	let ts = 1;
	if (tOut && f >= dur - 4) {
		const p = interpolate(f, [dur - 4, dur - 1], [0, 1], CLAMP);
		blur = 24 * p;
		ts = 1 - 0.03 * p;
	}
	if (tIn && f < 4) {
		const p = interpolate(f, [0, 3], [1, 0], CLAMP);
		blur = 24 * p;
		ts = 1 + 0.04 * p;
	}
	return (
		<AbsoluteFill style={{transform: `scale(${s * ts})`, transformOrigin: `${(SAFE.left + SAFE.right) / 2}px 50%`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>
			{children}
		</AbsoluteFill>
	);
};

type Sfx = {f: number; file: string; v: number};
const SFX: Sfx[] = [
	{f: 0, file: 'whoosh', v: 0.3},
	{f: 4, file: 'boom', v: 0.35},
	{f: 42, file: 'pop', v: 0.3},
	...[...INVERT].map((f) => ({f, file: 'tick', v: 0.2})),
	...[105, 300, 495].map((f) => ({f, file: 'whoosh', v: 0.3})),
	{f: 105 + 122, file: 'pop', v: 0.3},
	{f: 300 + 126, file: 'pop', v: 0.35},
	{f: 495 + 186, file: 'pop', v: 0.3},
	{f: 735, file: 'boom', v: 0.4},
	{f: 1030, file: 'whoosh', v: 0.3},
	{f: 1030 + 60, file: 'click', v: 0.45},
	{f: 1030 + 62, file: 'boom', v: 0.35},
];

// "low" bed under a voice-over that is added later.
const musicVolume = (f: number) => interpolate(f, [0, 8, TUT_DURATION - 30, TUT_DURATION], [0.3, 0.2, 0.2, 0.3], CLAMP);

export const TutorialReel: React.FC<{showSafe?: boolean; sfx?: boolean}> = ({showSafe, sfx = true}) => {
	const frame = useCurrentFrame();
	const inv = INVERT.has(frame);
	return (
		<AbsoluteFill style={{backgroundColor: '#E2DBD1', filter: `saturate(.9) contrast(.97) sepia(.05)${inv ? ' invert(1)' : ''}`}}>
			<Paper />
			<CameraMotionBlur shutterAngle={180} samples={4}>
				{TUT_SCENES.map((s, i) => {
					const T = TEMPLATES[s.template];
					const dur = s.to - s.from;
					return (
						<Sequence key={i} from={s.from} durationInFrames={dur} layout="none">
							<Shell i={i} dur={dur} tIn={T2_IN.has(s.template)} tOut={T2_OUT.has(s.template)}>
								<T dur={dur} />
							</Shell>
						</Sequence>
					);
				})}
			</CameraMotionBlur>
			<GradeOverlay />
			{showSafe ? (
				<AbsoluteFill style={{pointerEvents: 'none'}}>
					<div style={{position: 'absolute', left: 0, right: 0, top: 0, height: SAFE.top, background: 'rgba(255,0,0,.25)'}} />
					<div style={{position: 'absolute', left: 0, right: 0, top: SAFE.bottom, bottom: 0, background: 'rgba(255,0,0,.25)'}} />
					<div style={{position: 'absolute', left: SAFE.right, right: 0, top: 0, bottom: 0, background: 'rgba(255,0,0,.18)'}} />
					<div style={{position: 'absolute', left: 0, width: SAFE.left, top: 0, bottom: 0, background: 'rgba(255,0,0,.18)'}} />
				</AbsoluteFill>
			) : null}
			<Audio src={staticFile('tut/music.wav')} volume={musicVolume} />
			{sfx
				? SFX.map((s, i) => (
						<Sequence key={i} from={s.f} durationInFrames={45} layout="none">
							<Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.v} />
						</Sequence>
					))
				: null}
		</AbsoluteFill>
	);
};
