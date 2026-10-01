import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import {loadFonts} from '../shared/fonts';
import {CLAMP} from '../shared/easing';
import {Word} from '../shared/KineticText';
import {GradeOverlay, Paper} from '../styles/A/parts';
import {FPS, SCENES as DEFS, VO_END, WORDS} from './content';
import {SAFE, TEMPLATES} from './scenes';

loadFonts();

// Words are consumed in order by the scene lines; each reveal starts 2f before the spoken word.
const buildScenes = () => {
	let k = 0;
	return DEFS.map((s) => {
		const lines: Word[][] = s.lines.map((line) =>
			line.map((text) => {
				const [, t] = WORDS[k++];
				return {text, at: Math.round(t * FPS) - 2 - s.from};
			}),
		);
		return {...s, lines, dur: s.to - s.from};
	});
};
const SCENES = buildScenes();

const long = (c: number) => [c - 9, c - 6, c - 3, c - 2, c - 1];
const short = (c: number) => [c - 4, c - 1];
const INVERT = new Set<number>([...long(92), ...short(228), ...short(413)]);
const T2_OUT = new Set(['SEND', 'TEMPLATES']);
const T2_IN = new Set(['BROADCAST', 'INBOX']);

const Shell: React.FC<{i: number; dur: number; tIn: boolean; tOut: boolean; children: React.ReactNode}> = ({i, dur, tIn, tOut, children}) => {
	const f = useCurrentFrame();
	const s = i % 2 === 0 ? interpolate(f, [0, dur], [1, 1.04], CLAMP) : interpolate(f, [0, dur], [1.04, 1], CLAMP);
	const y = interpolate(f, [0, dur], [0, -16], CLAMP);
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
		<AbsoluteFill style={{transform: `translateY(${y}px) scale(${s * ts})`, transformOrigin: `${(SAFE.left + SAFE.right) / 2}px 50%`, filter: blur > 0.1 ? `blur(${blur}px)` : undefined}}>
			{children}
		</AbsoluteFill>
	);
};

const w = (t: number) => Math.round(t * FPS);
type Sfx = {f: number; file: string; v: number};
// SFX kept low so the voice-over stays on top.
const SFX: Sfx[] = [
	{f: 0, file: 'whoosh', v: 0.4},
	{f: w(0.25), file: 'boom', v: 0.45},
	{f: w(0.85), file: 'pop', v: 0.35},
	{f: w(1.6), file: 'pop', v: 0.35},
	...[...INVERT].map((f) => ({f, file: 'tick', v: 0.25})),
	{f: 92, file: 'whoosh', v: 0.4},
	{f: w(3.62), file: 'click', v: 0.5},
	{f: w(3.75), file: 'whoosh', v: 0.3},
	{f: w(4.45), file: 'pop', v: 0.4},
	{f: 161, file: 'boom', v: 0.45},
	{f: w(6.4), file: 'pop', v: 0.3},
	{f: w(6.8), file: 'pop', v: 0.3},
	{f: 228, file: 'whoosh', v: 0.35},
	{f: w(8.4), file: 'pop', v: 0.35},
	{f: 275, file: 'whoosh', v: 0.35},
	{f: w(9.9), file: 'pop', v: 0.4},
	{f: w(10.0), file: 'pop', v: 0.35},
	{f: 318, file: 'boom', v: 0.4},
	{f: w(11.8), file: 'pop', v: 0.3},
	{f: w(12.65), file: 'click', v: 0.35},
	{f: 413, file: 'whoosh', v: 0.35},
	{f: w(15.05), file: 'boom', v: 0.55},
	{f: 494, file: 'whoosh', v: 0.3},
	{f: w(18.85), file: 'click', v: 0.55},
	{f: w(19.5), file: 'whoosh', v: 0.45},
	{f: w(19.85), file: 'boom', v: 0.5},
];

// Music sits ~15 dB under the VO, swells after the last word.
const musicVolume = (f: number) => interpolate(f, [0, 6, w(VO_END), w(VO_END) + 12], [0.4, 0.26, 0.26, 0.55], CLAMP);

export const WhatsAppReel: React.FC<{showSafe?: boolean}> = ({showSafe}) => {
	const frame = useCurrentFrame();
	const inv = INVERT.has(frame);
	return (
		<AbsoluteFill style={{backgroundColor: '#E2DBD1', filter: `saturate(.85) contrast(.95) sepia(.08)${inv ? ' invert(1)' : ''}`}}>
			<Paper />
			<CameraMotionBlur shutterAngle={200} samples={8}>
				{SCENES.map((s, i) => {
					const T = TEMPLATES[s.template];
					return (
						<Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
							<Shell i={i} dur={s.dur} tIn={T2_IN.has(s.template)} tOut={T2_OUT.has(s.template)}>
								<T lines={s.lines} dur={s.dur} />
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
			<Audio src={staticFile('wa/vo.wav')} />
			<Audio src={staticFile('wa/music.wav')} volume={musicVolume} />
			{SFX.map((s, i) => (
				<Sequence key={i} from={s.f} durationInFrames={45} layout="none">
					<Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.v} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
