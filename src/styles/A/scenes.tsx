import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Word, KineticLine} from '../../shared/KineticText';
import {CLAMP, EASE_IN_OUT, EASE_OUT, pop, ramp, rand} from '../../shared/easing';
import {AR_FONT, UI_FONT, WORDMARK_FONT} from '../../shared/fonts';
import {Cursor, Glyph, HandLine, Magnifier, Pillar, Starburst, Tile, VideoCard} from './parts';
import {C, CUTOUT_SHADOW, H, TEXT_SHADOW, TEXT_SHADOW_RED, W} from './tokens';

export type SceneProps = {lines: Word[][]; dur: number; data: any};

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({
	x,
	y,
	children,
	style,
}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', ...style}}>{children}</div>
);

// cursor idle float: 6px / 36f, rotation ±2°
const idle = (f: number) => ({dy: Math.sin((f / 36) * Math.PI * 2) * 6, rot: Math.sin((f / 36) * Math.PI * 2 + 1) * 2});
const press = (f: number, at: number) => interpolate(f, [at, at + 2, at + 6], [0, 1, 0], CLAMP);

/* ============ S1 HOOK_HERO ============ */
export const HookHero: React.FC<SceneProps> = ({lines, data}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cam = f < 27 ? ramp(f, 0, 27, 1.35, 1) : interpolate(f, [27, 57], [1, 1.03], CLAMP);
	const fan = spring({frame: f - 5, fps, config: {damping: 13, stiffness: 170, mass: 0.7}});
	const burst = pop(f, fps, 6);
	const cw = W * 0.3;
	const ch = H * 0.25;
	const cx = W * 0.5;
	const cy = H * 0.45;
	const curT = ramp(f, 34, 46, 0, 1);
	const cur = {x: interpolate(curT, [0, 1], [-260, W * 0.56]), y: interpolate(curT, [0, 1], [H * 0.95, H * 0.5])};
	const click = press(f, 47);
	return (
		<AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: '50% 43%'}}>
			<Starburst cx={W * 0.5} cy={H * 0.45} size={W * 1.08} scale={burst} rot={f * 0.25} seed={3} />
			<Pillar lines={data.receipt} total={data.total} />
			{[-1, 1].map((s) => (
				<Abs key={s} x={cx + s * W * 0.22 * fan} y={cy + 30 * fan}>
					<div style={{transform: `rotate(${s * 18 * fan}deg)`}}>
						<VideoCard w={cw * 0.92} h={ch * 0.92} views={s < 0 ? '84K' : '310K'} icon={s < 0 ? 'sound' : 'motion'} />
					</div>
				</Abs>
			))}
			<Abs x={cx} y={cy}>
				<div style={{transform: `scale(${1 - 0.04 * click})`}}>
					<VideoCard w={cw} h={ch} views="1.2M" selected={click > 0 || f > 49 ? 1 : 0} />
				</div>
			</Abs>
			<KineticLine words={lines[0]} y={H * 0.115} size={108} />
			{f >= 34 ? <Cursor x={cur.x} y={cur.y} press={click} rot={-4 * (1 - curT)} /> : null}
		</AbsoluteFill>
	);
};

/* ============ S2 SELECT_CARDS ============ */
export const SelectCards: React.FC<SceneProps> = ({lines, dur, data}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const ats = [lines[0][0].at, lines[0][1].at, lines[1][0].at];
	const xs = [W * 0.83, W * 0.5, W * 0.17];
	const cw = W * 0.29;
	const chh = H * 0.42;
	const cy = H * 0.53;
	// cursor waypoints (RTL: right -> left)
	const pts = [
		{x: W * 0.2, y: H * 1.05},
		...xs.map((x) => ({x: x - 20, y: cy + 60})),
	];
	const legs = [
		{a: ats[0] - 6, b: ats[0] + 1},
		{a: ats[1] - 8, b: ats[1] + 1},
		{a: ats[2] - 8, b: ats[2] + 1},
	];
	let cx = pts[0].x;
	let cyy = pts[0].y;
	legs.forEach((l, i) => {
		if (f >= l.a) {
			const t = ramp(f, l.a, l.b, 0, 1);
			cx = interpolate(t, [0, 1], [pts[i].x, pts[i + 1].x]);
			cyy = interpolate(t, [0, 1], [pts[i].y, pts[i + 1].y]);
		}
	});
	const endT = ramp(f, dur - 22, dur, 0, 1, EASE_IN_OUT);
	const exit = ramp(f, ats[2] + 18, ats[2] + 24, 0, 1);
	const id = idle(f);
	let clickP = 0;
	ats.forEach((a) => (clickP = Math.max(clickP, press(f, a + 2))));
	return (
		<AbsoluteFill>
			<KineticLine words={lines[0]} y={H * 0.115} size={96} />
			<KineticLine words={lines[1]} y={H * 0.19} size={96} />
			<AbsoluteFill style={{transform: `translateY(${-40 * endT}px) scale(${1 - 0.05 * endT})`}}>
				{xs.map((x, i) => {
					const s = pop(f, fps, ats[i] - 3);
					const sel = ramp(f, ats[i] + 3, ats[i] + 6, 0, 1);
					const op = interpolate(f, [ats[i] - 3, ats[i]], [0, 1], CLAMP);
					return (
						<Abs key={i} x={x} y={cy} style={{opacity: op}}>
							<div style={{transform: `translateY(${(1 - s) * 120}px) scale(${Math.max(0, s)}) rotate(${[-2, 1.5, -1][i]}deg)`}}>
								<VideoCard w={cw} h={chh} icon={data.cards[i].icon} label={data.cards[i].label} selected={sel} gray={0.85 * (1 - sel)} />
							</div>
							<div
								style={{
									position: 'absolute',
									top: -34,
									left: '50%',
									transform: `translateX(-50%) scale(${Math.max(0, pop(f, fps, ats[i] + 4))})`,
									background: C.crimson,
									color: C.cream,
									fontFamily: UI_FONT,
									fontWeight: 800,
									fontSize: 30,
									padding: '10px 22px',
									borderRadius: 12,
									boxShadow: '0 6px 0 rgba(20,15,12,.5)',
									whiteSpace: 'nowrap',
								}}
							>
								AI ✓
							</div>
						</Abs>
					);
				})}
			</AbsoluteFill>
			{f >= legs[0].a ? (
				<Cursor x={cx + exit * 900} y={cyy + id.dy} press={clickP} rot={id.rot} />
			) : null}
		</AbsoluteFill>
	);
};

/* ============ S3 AI_TILE ============ */
export const AiTile: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const w = lines[0];
	const t = pop(f, fps, 1);
	const bb = pop(f, fps, w[1].at + 1);
	const punch = interpolate(f, [w[2].at, w[2].at + 3, w[2].at + 10], [1, 1.09, 1], CLAMP);
	const size = W * 0.46;
	const cx = W * 0.5;
	const cy = H * 0.4;
	return (
		<AbsoluteFill>
			<Starburst cx={cx} cy={cy} size={W * 1.2} scale={pop(f, fps, 0)} rot={-f * 0.35} seed={9} />
			<Abs x={cx} y={cy}>
				<div style={{transform: `scale(${Math.max(0, t) * punch}) rotate(${-10 + 6 * t}deg)`}}>
					<Tile size={size} icon="ai" />
				</div>
			</Abs>
			<Starburst cx={cx - size * 0.52} cy={cy - size * 0.5} size={W * 0.34} color={C.cursor} scale={bb} rot={f * 0.8} seed={21}>
				<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 64, color: C.cream, transform: 'rotate(-8deg)'}}>100%</div>
			</Starburst>
			<KineticLine words={w} y={H * 0.68} size={104} />
		</AbsoluteFill>
	);
};

/* ============ S4 BRAND_LINE ============ */
export const BrandLine: React.FC<SceneProps> = ({lines, dur, data}) => {
	const f = useCurrentFrame();
	const w = lines[0];
	const at = w[2].at + 3;
	const wm = ramp(f, at, at + 6, 0, 1);
	const rise = ramp(f, at, at + 5, 10, 0);
	const line = ramp(f, at + 4, at + 14, 0, 1);
	const id = idle(f);
	const enter = ramp(f, 0, 12, 0, 1);
	const exitT = ramp(f, dur - 8, dur - 3, 0, 1, EASE_IN_OUT);
	return (
		<AbsoluteFill>
			<KineticLine words={w} y={H * 0.44} size={104} />
			<div
				style={{
					position: 'absolute',
					top: H * 0.53 + rise,
					left: 0,
					right: 0,
					textAlign: 'center',
					fontFamily: WORDMARK_FONT,
					fontWeight: 900,
					fontSize: 100,
					letterSpacing: '.06em',
					color: C.ink,
					opacity: wm,
					filter: `blur(${18 * (1 - wm)}px)`,
					transform: `translateY(-50%) scale(${1.08 - 0.08 * wm})`,
					textShadow: TEXT_SHADOW,
				}}
			>
				{data.wordmark}
			</div>
			<svg width={W} height={40} style={{position: 'absolute', top: H * 0.53 + 70, left: 0}}>
				<path d={`M${W * 0.22} 20 Q ${W * 0.5} ${8} ${W * 0.78} 22`} stroke={C.crimson} strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} />
			</svg>
			<Cursor
				x={interpolate(enter, [0, 1], [-200, W * 0.66]) + exitT * 900}
				y={interpolate(enter, [0, 1], [H * 1.0, H * 0.7]) + id.dy}
				rot={id.rot}
			/>
		</AbsoluteFill>
	);
};

/* ============ S5 ICON_JOURNEY (prompt -> skill) ============ */
export const IconJourney: React.FC<SceneProps> = ({lines, data}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const SP = 720;
	const whipA = lines[1][0].at - 5;
	const whip = ramp(f, whipA, whipA + 4, 0, 1, EASE_IN_OUT);
	const camX = SP * whip;
	const hold = f < whipA ? ramp(f, 6, whipA, 1, 1.05, (t) => t) : ramp(f, whipA + 4, whipA + 30, 1, 1.05, (t) => t);
	const enter = spring({frame: f, fps, config: {damping: 14, stiffness: 200, mass: 0.6}});
	const size = W * 0.39;
	const cy = H * 0.53;
	const b1 = pop(f, fps, lines[0][1].at + 1);
	const b2 = pop(f, fps, lines[1][1].at + 1);
	const draw = ramp(f, whipA - 4, whipA + 6, 0, 1, (t) => t);
	const t2 = spring({frame: f - whipA - 3, fps, config: {damping: 11, stiffness: 190, mass: 0.6}});
	const x1 = W / 2;
	const x2 = W / 2 - SP;
	const wob = `M ${W + x1 - size / 2} ${cy + 40} C ${W + x1 - size * 0.9} ${cy + 180}, ${W + x1 - 320} ${cy - 160}, ${W + x2 + 200} ${cy + 90} S ${W + x2 + size / 2 + 30} ${cy - 20}, ${W + x2 + size / 2} ${cy + 10}`;
	return (
		<AbsoluteFill style={{transform: `scale(${hold})`}}>
			<AbsoluteFill style={{transform: `translateX(${camX}px)`}}>
				<HandLine d={wob} progress={draw} />
				<Abs x={x1 + (1 - enter) * W * 0.5} y={cy}>
					<Tile size={size} icon={data.icons[0]} tilt={4} />
				</Abs>
				<Abs x={x2} y={cy}>
					<div style={{transform: `scale(${0.85 + 0.15 * Math.max(0, t2)})`}}>
						<Tile size={size} icon={data.icons[1]} tilt={-22} />
					</div>
				</Abs>
				<Starburst cx={x1 + size * 0.5} cy={cy - size * 0.5} size={W * 0.3} color={C.cursor} scale={b1} rot={f} seed={31}>
					<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 84, color: C.cream}}>{data.badge}</div>
				</Starburst>
				<Starburst cx={x2 - size * 0.5} cy={cy - size * 0.45} size={W * 0.3} color={C.cursor} scale={b2} rot={-f} seed={44}>
					<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 84, color: C.cream}}>{data.badge}</div>
				</Starburst>
				<div style={{position: 'absolute', inset: 0, opacity: 1 - whip}}>
					<KineticLine words={lines[0]} y={H * 0.25} size={108} />
				</div>
				<div style={{position: 'absolute', inset: 0, transform: `translateX(${-SP}px)`, opacity: whip}}>
					<KineticLine words={lines[1]} y={H * 0.25} size={108} />
				</div>
				{/* caption chips under tiles */}
				{[
					{x: x1, t: 'PROMPT'},
					{x: x2, t: 'SKILL'},
				].map((c, i) => (
					<Abs key={i} x={c.x} y={cy + size * 0.72}>
						<div style={{fontFamily: WORDMARK_FONT, fontWeight: 900, fontSize: 46, letterSpacing: '.08em', color: C.ink, textShadow: TEXT_SHADOW}}>
							{c.t}
						</div>
					</Abs>
				))}
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/* ============ S6 PUNCH_LINE ============ */
export const PunchLine: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const hit = lines[1][0].at;
	const k = spring({frame: f - hit, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
	const shake = f >= hit && f < hit + 8 ? (1 - (f - hit) / 8) * 14 : 0;
	const sx = (rand(f * 1.3) - 0.5) * 2 * shake;
	const sy = (rand(f * 2.7) - 0.5) * 2 * shake;
	const bb = pop(f, fps, hit - 1);
	return (
		<AbsoluteFill style={{transform: `translate(${sx}px,${sy}px) scale(${1 + 0.1 * Math.max(0, k)})`}}>
			<Starburst cx={W / 2} cy={H * 0.47} size={W * 1.35} scale={pop(f, fps, 0)} rot={f * 0.6} seed={57} />
			<Starburst cx={W / 2} cy={H * 0.53} size={W * 0.95} color={C.cursor} scale={bb} rot={-f * 1.2} seed={77} />
			<KineticLine words={lines[0]} y={H * 0.38} size={116} color={C.cream} onRed />
			<KineticLine words={lines[1]} y={H * 0.53} size={196} color={C.cream} onRed />
		</AbsoluteFill>
	);
};

/* ============ S7 LENS_INSPECT ============ */
const Collage: React.FC = () => {
	const nodes = [
		[0.18, 0.44],
		[0.34, 0.37],
		[0.3, 0.55],
		[0.5, 0.46],
		[0.66, 0.36],
		[0.7, 0.56],
		[0.86, 0.46],
	];
	const edges = [
		[0, 1],
		[0, 2],
		[1, 3],
		[2, 3],
		[3, 4],
		[3, 5],
		[4, 6],
		[5, 6],
		[1, 4],
		[2, 5],
	];
	return (
		<AbsoluteFill>
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{edges.map(([a, b], i) => (
					<line key={i} x1={nodes[a][0] * W} y1={nodes[a][1] * H} x2={nodes[b][0] * W} y2={nodes[b][1] * H} stroke={C.maroon} strokeWidth={7} />
				))}
				{nodes.map(([x, y], i) => (
					<circle key={i} cx={x * W} cy={y * H} r={30} fill={i === 3 ? C.crimson : '#D98A8A'} stroke={C.cream} strokeWidth={8} />
				))}
				{/* bar chart */}
				{[0.3, 0.52, 0.44, 0.7, 0.62, 0.9].map((v, i) => (
					<rect key={i} x={W * 0.12 + i * 70} y={H * 0.86 - v * 260} width={46} height={v * 260} rx={8} fill={i === 5 ? C.crimson : '#E3A3A3'} />
				))}
			</svg>
			<Abs x={W * 0.74} y={H * 0.75}>
				<Tile size={W * 0.26} icon="ai" tilt={8} />
			</Abs>
			<Abs x={W * 0.5} y={H * 0.66}>
				<div
					style={{
						background: C.cardFrame,
						border: `5px solid ${C.crimson}`,
						borderRadius: 24,
						padding: '18px 30px',
						fontFamily: UI_FONT,
						fontWeight: 800,
						fontSize: 40,
						color: C.ink,
						filter: CUTOUT_SHADOW,
						whiteSpace: 'nowrap',
					}}
				>
					PROMPT → VIDEO
				</div>
			</Abs>
		</AbsoluteFill>
	);
};

export const LensInspect: React.FC<SceneProps> = ({lines, dur}) => {
	const f = useCurrentFrame();
	const t = interpolate(f, [0, dur], [0, 1], CLAMP);
	const lx = interpolate(t, [0, 1], [W * 0.58, W * 0.4]);
	const ly = interpolate(t, [0, 1], [H * 0.6, H * 0.62]);
	const r = 230;
	return (
		<AbsoluteFill>
			<AbsoluteFill style={{filter: 'blur(12px) saturate(.9)', opacity: 0.8}}>
				<Collage />
			</AbsoluteFill>
			<AbsoluteFill style={{clipPath: `circle(${r}px at ${lx}px ${ly}px)`}}>
				<AbsoluteFill style={{background: C.paperLight}} />
				<AbsoluteFill style={{transform: 'scale(1.5)', transformOrigin: `${lx}px ${ly}px`}}>
					<Collage />
				</AbsoluteFill>
			</AbsoluteFill>
			<Magnifier cx={lx} cy={ly} r={r} />
			<KineticLine words={lines[0]} y={H * 0.12} size={100} />
			<KineticLine words={lines[1]} y={H * 0.2} size={100} />
		</AbsoluteFill>
	);
};

/* ============ S8 STEPPED_CARDS ============ */
export const SteppedCards: React.FC<SceneProps> = ({lines, data}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const base = H * 0.64;
	const cards = [
		{x0: 0.08, x1: 0.28, h: 320, at: 3},
		{x0: 0.31, x1: 0.59, h: 440, at: 9},
		{x0: 0.6, x1: 0.93, h: 560, at: 17},
	];
	const tag = pop(f, fps, 21);
	const circ = pop(f, fps, 23);
	return (
		<AbsoluteFill>
			{cards.map((c, i) => {
				const s = pop(f, fps, c.at);
				const w = (c.x1 - c.x0) * W;
				return (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: c.x0 * W,
							top: base - c.h,
							transformOrigin: '50% 100%',
							transform: `scale(${Math.max(0, s)})`,
							opacity: interpolate(f, [c.at, c.at + 3], [0, 1], CLAMP),
						}}
					>
						<VideoCard w={w} h={c.h} views={data.cards[i]} selected={i === 2 ? 1 : 0} />
					</div>
				);
			})}
			<div
				style={{
					position: 'absolute',
					left: 0.6 * W + 20,
					top: base - 560 - 44,
					transform: `scale(${Math.max(0, tag)}) rotate(-6deg)`,
					background: C.green,
					color: '#fff',
					fontFamily: UI_FONT,
					fontWeight: 800,
					fontSize: 34,
					padding: '10px 22px',
					borderRadius: 12,
					boxShadow: '0 6px 0 rgba(20,15,12,.45)',
				}}
			>
				VIRAL ✓
			</div>
			<div
				style={{
					position: 'absolute',
					left: 0.93 * W - 60,
					top: base - 560 - 40,
					width: 100,
					height: 100,
					borderRadius: '50%',
					background: C.green,
					border: `6px solid ${C.cream}`,
					transform: `scale(${Math.max(0, circ)})`,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					boxShadow: '0 8px 0 rgba(20,15,12,.45)',
				}}
			>
				<Glyph name="check" size={70} color="#fff" stroke={18} />
			</div>
			<KineticLine words={lines[0]} y={H * 0.73} size={86} />
		</AbsoluteFill>
	);
};

/* ============ S9 CTA ============ */
export const Cta: React.FC<SceneProps> = ({lines, dur, data}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const b = pop(f, fps, 3);
	const clickAt = 16;
	const cl = press(f, clickAt);
	const done = ramp(f, clickAt + 2, clickAt + 6, 0, 1);
	const curT = ramp(f, 4, 15, 0, 1);
	const exitT = ramp(f, clickAt + 10, clickAt + 15, 0, 1, EASE_IN_OUT);
	const bx = W * 0.5;
	const by = H * 0.49;
	const id = idle(f);
	const hit = lines[1][1].at;
	const plane = spring({frame: f - hit + 2, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
	const bb = pop(f, fps, hit + 1);
	const push = interpolate(f, [0, dur], [1, 1.06], CLAMP);
	return (
		<AbsoluteFill style={{transform: `scale(${push})`}}>
			<div
				style={{
					position: 'absolute',
					left: -40,
					right: -40,
					top: H * 0.74 + (1 - plane) * H * 0.35,
					bottom: -60,
					background: `linear-gradient(180deg, ${C.maroon}, ${C.maroonDeep})`,
					boxShadow: '0 -10px 30px rgba(30,20,15,.3)',
				}}
			/>
			<Starburst cx={W * 0.8} cy={H * 0.8} size={W * 0.42} color={C.cursor} scale={bb} rot={f} seed={88}>
				<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 58, color: C.cream, transform: 'rotate(8deg)'}}>NEXT</div>
			</Starburst>
			<KineticLine words={lines[0]} y={H * 0.33} size={150} variant="line" />
			<Abs x={bx} y={by}>
				<div
					style={{
						transform: `scale(${Math.max(0, b) * (1 - 0.06 * cl)})`,
						width: W * 0.66,
						height: 150,
						borderRadius: 75,
						background: `linear-gradient(180deg, ${C.crimsonHi}, ${C.crimson})`,
						border: `6px solid ${C.cream}`,
						boxShadow: '0 10px 0 rgba(20,15,12,.55), 0 18px 24px rgba(20,15,12,.3)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						position: 'relative',
						fontFamily: AR_FONT,
						fontWeight: 900,
						fontSize: 66,
						color: C.cream,
						textShadow: TEXT_SHADOW_RED,
						direction: 'rtl',
					}}
				>
					<span style={{position: 'absolute', opacity: 1 - done, filter: `blur(${10 * done}px)`}}>{data.button} +</span>
					<span style={{position: 'absolute', opacity: done, filter: `blur(${10 * (1 - done)}px)`}}>✓ {data.buttonDone}</span>
				</div>
			</Abs>
			<KineticLine words={lines[1]} y={H * 0.63} size={150} />
			{f >= 4 ? (
				<Cursor
					x={interpolate(curT, [0, 1], [-220, bx + 60]) + exitT * 900}
					y={interpolate(curT, [0, 1], [H * 1.02, by + 20]) + (f > clickAt + 6 ? id.dy : 0)}
					press={cl}
					rot={id.rot}
				/>
			) : null}
		</AbsoluteFill>
	);
};

export const TEMPLATES: Record<string, React.FC<SceneProps>> = {
	HOOK_HERO: HookHero,
	SELECT_CARDS: SelectCards,
	AI_TILE: AiTile,
	BRAND_LINE: BrandLine,
	ICON_JOURNEY: IconJourney,
	PUNCH_LINE: PunchLine,
	LENS_INSPECT: LensInspect,
	STEPPED_CARDS: SteppedCards,
	CTA: Cta,
};
