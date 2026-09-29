import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import content from '../../content.json';
import {loadFonts} from '../../shared/fonts';
import {CLAMP} from '../../shared/easing';
import {Word} from '../../shared/KineticText';
import {GradeOverlay, Paper} from './parts';
import {TEMPLATES} from './scenes';

loadFonts();

const FPS = content.fps;
// Words from the VO timeline are consumed in order by the scene lines.
// Each reveal starts 2f before the spoken word.
const buildScenes = () => {
	let k = 0;
	return content.scenes.map((s) => {
		const lines: Word[][] = s.lines.map((line) =>
			line.map((text) => {
				const [, t] = content.words[k++] as [string, number];
				return {text, at: Math.round((t as number) * FPS) - 2 - s.from};
			}),
		);
		return {...s, lines, dur: s.to - s.from};
	});
};
const SCENES = buildScenes();

// ---- transition map (cut frames) ----
// T1 invert strobe: long / short / edge
const long = (c: number) => [c - 9, c - 6, c - 3, c - 2, c - 1];
const short = (c: number) => [c - 4, c - 1];
const edge = (c: number) => [c - 3, c - 2, c - 1, c, c + 1, c + 2];
const INVERT = new Set<number>([...long(57), ...short(196), ...long(352), ...edge(404)]);
// T2 defocus: out on the outgoing scene, in on the incoming one
const T2_OUT = new Set(['SELECT_CARDS', 'STEPPED_CARDS']);
const T2_IN = new Set(['AI_TILE', 'CTA']);

const Shell: React.FC<{i: number; dur: number; tIn: boolean; tOut: boolean; children: React.ReactNode}> = ({
	i,
	dur,
	tIn,
	tOut,
	children,
}) => {
	const f = useCurrentFrame();
	// drift: alternate push-in / pull-out, y 0 -> -24px, linear
	const s = i % 2 === 0 ? interpolate(f, [0, dur], [1, 1.04], CLAMP) : interpolate(f, [0, dur], [1.04, 1], CLAMP);
	const y = interpolate(f, [0, dur], [0, -24], CLAMP);
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
		<AbsoluteFill
			style={{
				transform: `translateY(${y}px) scale(${s * ts})`,
				filter: blur > 0.1 ? `blur(${blur}px)` : undefined,
			}}
		>
			{children}
		</AbsoluteFill>
	);
};

type Sfx = {f: number; file: string; v: number};
const SFX: Sfx[] = [
	{f: 0, file: 'whoosh', v: 0.7},
	{f: 6, file: 'boom', v: 0.8},
	{f: 47, file: 'click', v: 0.9},
	...[...INVERT].map((f) => ({f, file: 'tick', v: 0.45})),
	{f: 60, file: 'pop', v: 0.7},
	{f: 85, file: 'pop', v: 0.7},
	{f: 110, file: 'pop', v: 0.7},
	{f: 64, file: 'click', v: 0.8},
	{f: 89, file: 'click', v: 0.8},
	{f: 114, file: 'click', v: 0.8},
	{f: 146, file: 'boom', v: 0.9},
	{f: 160, file: 'pop', v: 0.7},
	{f: 219, file: 'whoosh', v: 0.5},
	{f: 238, file: 'whoosh', v: 0.8},
	{f: 253, file: 'pop', v: 0.7},
	{f: 266, file: 'whoosh', v: 0.9},
	{f: 279, file: 'pop', v: 0.7},
	{f: 302, file: 'boom', v: 0.7},
	{f: 325, file: 'boom', v: 1},
	{f: 352, file: 'whoosh', v: 0.5},
	{f: 407, file: 'pop', v: 0.6},
	{f: 413, file: 'pop', v: 0.6},
	{f: 421, file: 'pop', v: 0.7},
	{f: 427, file: 'pop', v: 0.6},
	{f: 455, file: 'whoosh', v: 0.6},
	{f: 471, file: 'click', v: 1},
	{f: 495, file: 'boom', v: 0.9},
];

export const Main: React.FC = () => {
	const frame = useCurrentFrame();
	const inv = INVERT.has(frame);
	return (
		<AbsoluteFill
			style={{
				backgroundColor: '#E2DBD1',
				filter: `saturate(.85) contrast(.95) sepia(.08)${inv ? ' invert(1)' : ''}`,
			}}
		>
			<Paper />
			<CameraMotionBlur shutterAngle={200} samples={8}>
				{SCENES.map((s, i) => {
					const T = TEMPLATES[s.template];
					return (
						<Sequence key={i} from={s.from} durationInFrames={s.dur} layout="none">
							<Shell i={i} dur={s.dur} tIn={T2_IN.has(s.template)} tOut={T2_OUT.has(s.template)}>
								<T lines={s.lines} dur={s.dur} data={s} />
							</Shell>
						</Sequence>
					);
				})}
			</CameraMotionBlur>
			<GradeOverlay />
			<Audio src={staticFile(content.voiceover)} />
			<Audio src={staticFile(content.music)} volume={0.5} />
			{SFX.map((s, i) => (
				<Sequence key={i} from={s.f} durationInFrames={45} layout="none">
					<Audio src={staticFile(`sfx/${s.file}.wav`)} volume={s.v} />
				</Sequence>
			))}
		</AbsoluteFill>
	);
};
