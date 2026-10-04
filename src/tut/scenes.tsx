import React from 'react';
import {AbsoluteFill, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Word, KineticLine} from '../shared/KineticText';
import {CLAMP, EASE_IN_OUT, pop, ramp} from '../shared/easing';
import {UI_FONT} from '../shared/fonts';
import {Glyph, Starburst, Tile} from '../styles/A/parts';
import {C, CUTOUT_SHADOW, H, TEXT_SHADOW_RED, W} from '../styles/A/tokens';

// Instagram Reels safe area for text.
export const SAFE = {top: 300, bottom: 1420, left: 80, right: 940};
const CX = (SAFE.left + SAFE.right) / 2;
const sc = (v: number) => Math.max(0, v);

export type SceneProps = {dur: number};

/* ---------- text phases: each phase holds until the next one starts ---------- */
type LineDef = {t: string[]; at: number[]; size: number; color?: string; onRed?: boolean};
type Phase = {at: number; lines: LineDef[]};

const Phases: React.FC<{phases: Phase[]; dur: number; y0?: number; gap?: number; onRedAll?: boolean}> = ({phases, dur, y0 = 395, gap = 112}) => {
	const f = useCurrentFrame();
	return (
		<>
			{phases.map((p, i) => {
				const until = i + 1 < phases.length ? phases[i + 1].at : dur + 10;
				if (f < p.at - 3 || f >= until) return null;
				const out = ramp(f, until - 5, until - 1, 0, 1, EASE_IN_OUT);
				return (
					<AbsoluteFill key={i} style={{opacity: 1 - out, filter: out > 0.01 ? `blur(${16 * out}px)` : undefined}}>
						{p.lines.map((l, j) => {
							const words: Word[] = l.t.map((text, k) => ({text, at: l.at[k]}));
							return (
								<KineticLine
									key={j}
									words={words}
									y={y0 + j * gap}
									size={l.size}
									color={l.color}
									onRed={l.onRed}
									style={{left: SAFE.left, right: W - SAFE.right}}
								/>
							);
						})}
					</AbsoluteFill>
				);
			})}
		</>
	);
};

// helper: words revealed every `step` frames starting at `at`
const L = (t: string, at: number, size = 96, color?: string, step = 9): LineDef => {
	const words = t.split(' ');
	return {t: words, at: words.map((_, i) => at + i * step), size, color};
};

const Chip: React.FC<{children: React.ReactNode; bg?: string; size?: number; rot?: number; scale?: number; color?: string}> = ({
	children,
	bg = C.ink,
	size = 34,
	rot = 0,
	scale = 1,
	color = '#fff',
}) => (
	<div
		style={{
			transform: `scale(${sc(scale)}) rotate(${rot}deg)`,
			background: bg,
			color,
			fontFamily: UI_FONT,
			fontWeight: 800,
			fontSize: size,
			padding: `${size * 0.3}px ${size * 0.65}px`,
			borderRadius: size * 0.36,
			boxShadow: '0 6px 0 rgba(20,15,12,.45)',
			whiteSpace: 'nowrap',
			letterSpacing: '.02em',
		}}
	>
		{children}
	</div>
);

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', ...style}}>{children}</div>
);

/* ---------- Phone frame playing a screen recording ---------- */
const SCREEN_W = 470;
const SCREEN_H = Math.round((SCREEN_W * 1920) / 886);
const PHONE_TOP = 640;

const Phone: React.FC<{src: string; startAt?: number; zoom?: number; zoomOrigin?: string; tilt?: number}> = ({src, startAt = 4, zoom = 1, zoomOrigin = '50% 50%', tilt = 0}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({frame: f, fps, config: {damping: 14, stiffness: 150, mass: 0.7}});
	const bez = 16;
	return (
		<div
			style={{
				position: 'absolute',
				left: CX - SCREEN_W / 2 - bez,
				top: PHONE_TOP + (1 - enter) * 1100,
				width: SCREEN_W + bez * 2,
				height: SCREEN_H + bez * 2,
				transform: `rotate(${tilt * enter}deg)`,
				filter: CUTOUT_SHADOW,
			}}
		>
			<div style={{position: 'absolute', inset: 0, borderRadius: 66, background: '#1b1716', boxShadow: `inset 0 0 0 4px #3a3330`}} />
			<div style={{position: 'absolute', inset: bez, borderRadius: 52, overflow: 'hidden', background: '#000'}}>
				<div style={{width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: zoomOrigin}}>
					<Sequence from={startAt} layout="none">
						<OffthreadVideo src={staticFile(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
					</Sequence>
				</div>
			</div>
		</div>
	);
};

const StepTag: React.FC<{n: number; icon: string}> = ({n, icon}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const s = pop(f, fps, 2);
	return (
		<Abs x={CX - 330} y={PHONE_TOP + 90}>
			<div style={{transform: `scale(${sc(s)}) rotate(-8deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14}}>
				<Tile size={150} icon={icon} />
				<Chip bg={C.crimson} size={34}>
					STEP {n}
				</Chip>
			</div>
		</Abs>
	);
};

/* ============ S1 HOOK ============ */
export const Hook: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cam = ramp(f, 0, 22, 1.2, 1);
	const free = pop(f, fps, 40);
	const ai = pop(f, fps, 56);
	return (
		<AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: `${CX}px 50%`}}>
			<Starburst cx={CX} cy={1180} size={W * 0.85} scale={pop(f, fps, 2)} rot={f * 0.3} seed={3} />
			<Abs x={CX} y={1180}>
				<div style={{transform: `scale(${sc(ai)}) rotate(${-10 + 6 * ai}deg)`}}>
					<Tile size={330} icon="ai" />
				</div>
			</Abs>
			<Starburst cx={CX + 230} cy={960} size={250} color={C.cursor} scale={free} rot={-f} seed={21}>
				<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 62, color: C.cream, transform: 'rotate(-8deg)'}}>FREE</div>
			</Starburst>
			<Phases
				dur={dur + 20}
				y0={420}
				gap={125}
				phases={[{at: 4, lines: [L('كيف تعمل إعلان', 4, 100, undefined, 8), L('لمنتجك مجانـــاً!', 30, 112, C.crimson, 10), L('بالذكاء الاصطناعي', 52, 92, undefined, 10)]}]}
			/>
		</AbsoluteFill>
	);
};

/* ============ S2 CAMERA ============ */
export const Camera: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const sun = pop(f, fps, 122);
	return (
		<AbsoluteFill>
			<Phone src="tut/c1.mp4" tilt={2} />
			<StepTag n={1} icon="camera" />
			<Starburst cx={CX + 330} cy={1050} size={230} color="#E8A317" scale={sun} rot={f * 1.2} seed={61}>
				<Glyph name="sun" size={120} color={C.cream} stroke={12} />
			</Starburst>
			<Phases
				dur={dur}
				phases={[
					{at: 6, lines: [L('افتح الكاميرا', 6, 100), L('وصوّر منتجك', 30, 104, C.crimson)]},
					{at: 84, lines: [L('من كل الزوايـــا', 84, 100), L('بإضاءة الشمس', 112, 104, C.crimson)]},
				]}
			/>
		</AbsoluteFill>
	);
};

/* ============ S3 CHATGPT ============ */
export const ChatGpt: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const resAt = 122;
	const zoom = interpolate(f, [resAt, resAt + 14], [1, 1.18], {...CLAMP, easing: EASE_IN_OUT});
	const wow = pop(f, fps, resAt + 4);
	const prompt = pop(f, fps, 66);
	return (
		<AbsoluteFill>
			<Phone src="tut/c2.mp4" zoom={zoom} zoomOrigin="50% 30%" tilt={-2} />
			<StepTag n={2} icon="prompt" />
			<Abs x={CX + 320} y={1120}>
				<Chip bg={C.green} size={36} rot={8} scale={f < resAt ? prompt : 0}>
					PROMPT ✓
				</Chip>
			</Abs>
			<Starburst cx={CX + 320} cy={1000} size={260} color={C.cursor} scale={wow} rot={f} seed={33}>
				<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 66, color: C.cream, transform: 'rotate(8deg)'}}>WOW</div>
			</Starburst>
			<Phases
				dur={dur}
				phases={[
					{at: 4, lines: [L('افتح ChatGPT', 4, 104), L('وأعطيه الصور', 28, 104, C.crimson)]},
					{at: 64, lines: [L('واكتبله هاد', 64, 100), L('البرومبـــت', 84, 108, C.crimson)]},
					{at: resAt - 2, lines: [L('وهاي النتيجة', resAt - 2, 100), L('الرائعـــة!', resAt + 16, 116, C.crimson)]},
				]}
			/>
		</AbsoluteFill>
	);
};

/* ============ S4 GOOGLE FLOW ============ */
export const Flow: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const clock = pop(f, fps, 186);
	return (
		<AbsoluteFill>
			<Phone src="tut/c3a.mp4" tilt={2} />
			<StepTag n={3} icon="play" />
			<Starburst cx={CX + 330} cy={1080} size={230} color={C.cursor} scale={clock} rot={-f} seed={13}>
				<div style={{transform: `rotate(${f * 8}deg)`}}>
					<Glyph name="clock" size={110} />
				</div>
			</Starburst>
			<Phases
				dur={dur}
				phases={[
					{at: 4, lines: [L('روح على جوجل', 4, 100), {t: ['Google Flow'], at: [24], size: 104, color: C.crimson}]},
					{at: 44, lines: [L('افتح مشروع', 44, 104), L('جديـــد', 60, 116, C.crimson)]},
					{at: 76, lines: [L('ارفق الصورة', 76, 104), L('من ChatGPT', 94, 104, C.crimson)]},
					{at: 128, lines: [L('واكتبله هاد', 128, 100), L('البرومبـــت', 146, 108, C.crimson)]},
					{at: 184, lines: [L('واستنى', 184, 108), L('شوي…', 198, 116, C.crimson)]},
				]}
			/>
		</AbsoluteFill>
	);
};

/* ============ S5 RESULT (full screen) ============ */
export const Result: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const open = spring({frame: f, fps, config: {damping: 16, stiffness: 130, mass: 0.8}});
	// grows out of the phone screen into full bleed
	const sw = interpolate(open, [0, 1], [SCREEN_W, W]);
	const sh = interpolate(open, [0, 1], [SCREEN_W * 1.77, H]);
	const r = interpolate(open, [0, 1], [52, 0]);
	const push = interpolate(f, [0, dur], [1, 1.06], CLAMP);
	const textOut = ramp(f, 110, 122, 0, 1);
	const badge = pop(f, fps, 20);
	return (
		<AbsoluteFill>
			<div
				style={{
					position: 'absolute',
					left: CX - sw / 2 + (W / 2 - CX) * open,
					top: interpolate(open, [0, 1], [PHONE_TOP + 16 + 92, 0]),
					width: sw,
					height: sh,
					borderRadius: r,
					overflow: 'hidden',
					background: '#000',
				}}
			>
				<div style={{width: '100%', height: '100%', transform: `scale(${push})`}}>
					<OffthreadVideo src={staticFile('tut/c3b.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} />
				</div>
			</div>
			{/* top scrim for legibility of the caption */}
			<AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(20,12,10,.55) 0%, rgba(20,12,10,.25) 30%, rgba(0,0,0,0) 42%)', opacity: 1 - textOut * 0.6}} />
			<div style={{opacity: 1 - textOut}}>
				<Phases dur={dur} phases={[{at: 6, lines: [L('وبتطلعلك', 6, 100, C.cream), L('هاي النتيجـــة!', 22, 116, C.cream)]}]} />
			</div>
			<Abs x={CX + 250} y={SAFE.top + 330}>
				<Chip bg={C.crimson} size={38} rot={-7} scale={badge}>
					100% AI ✓
				</Chip>
			</Abs>
		</AbsoluteFill>
	);
};

/* ============ S6 CTA (profile + follow) ============ */
export const Cta: React.FC<SceneProps> = ({dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const tapAt = 10 + 50; // follow tap inside the recording
	const go = pop(f, fps, tapAt + 2);
	const hit = spring({frame: f - tapAt, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
	return (
		<AbsoluteFill style={{transform: `scale(${1 + 0.03 * sc(hit) * (f < tapAt + 10 ? 1 : 0)})`}}>
			<Phone src="tut/c4.mp4" startAt={10} zoom={1.12} zoomOrigin="50% 0%" tilt={-2} />
			<Starburst cx={CX + 320} cy={1010} size={270} color={C.crimson} scale={go} rot={f} seed={88}>
				<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 50, color: C.cream, transform: 'rotate(8deg)', textShadow: TEXT_SHADOW_RED}}>FOLLOW</div>
			</Starburst>
			<Phases
				dur={dur}
				phases={[
					{at: 4, lines: [L('ولو مهتم تتعلم', 4, 96), L('الذكاء الاصطناعي', 24, 96, C.crimson)]},
					{at: tapAt - 4, lines: [L('تاااابعنـــي!', tapAt - 4, 140, C.crimson)]},
				]}
			/>
		</AbsoluteFill>
	);
};

export const TEMPLATES: Record<string, React.FC<SceneProps>> = {
	HOOK: Hook,
	CAMERA: Camera,
	CHATGPT: ChatGpt,
	FLOW: Flow,
	RESULT: Result,
	CTA: Cta,
};
