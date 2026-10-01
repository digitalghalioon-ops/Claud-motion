import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {Word, KineticLine} from '../shared/KineticText';
import {CLAMP, EASE_IN_OUT, pop, ramp, rand} from '../shared/easing';
import {AR_FONT, UI_FONT, WORDMARK_FONT} from '../shared/fonts';
import {Cursor, Glyph, HandLine, Starburst, Tile} from '../styles/A/parts';
import {C, CUTOUT_SHADOW, H, TEXT_SHADOW, TEXT_SHADOW_RED, W} from '../styles/A/tokens';

export type SceneProps = {lines: Word[][]; dur: number};

// Instagram Reels safe area: clear of the top bar, the caption/CTA strip at the
// bottom and the like/comment/share column on the right.
export const SAFE = {top: 300, bottom: 1420, left: 80, right: 940};
const CX = (SAFE.left + SAFE.right) / 2;
const L1 = 395;
const L2 = 500;
const L3 = 605;

const Line: React.FC<{words: Word[]; y: number; size: number; color?: string; onRed?: boolean; variant?: 'word' | 'line'}> = (p) => (
	<KineticLine {...p} style={{left: SAFE.left, right: W - SAFE.right}} />
);

const Abs: React.FC<{x: number; y: number; children: React.ReactNode; style?: React.CSSProperties}> = ({x, y, children, style}) => (
	<div style={{position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', ...style}}>{children}</div>
);

const idle = (f: number) => ({dy: Math.sin((f / 36) * Math.PI * 2) * 6, rot: Math.sin((f / 36) * Math.PI * 2 + 1) * 2});
const press = (f: number, at: number) => interpolate(f, [at, at + 2, at + 6], [0, 1, 0], CLAMP);
const sc = (v: number) => Math.max(0, v);

const Chip: React.FC<{children: React.ReactNode; bg?: string; size?: number; rot?: number; scale?: number}> = ({
	children,
	bg = C.green,
	size = 34,
	rot = 0,
	scale = 1,
}) => (
	<div
		style={{
			transform: `scale(${sc(scale)}) rotate(${rot}deg)`,
			background: bg,
			color: '#fff',
			fontFamily: UI_FONT,
			fontWeight: 800,
			fontSize: size,
			padding: `${size * 0.3}px ${size * 0.65}px`,
			borderRadius: size * 0.36,
			boxShadow: '0 6px 0 rgba(20,15,12,.45)',
			whiteSpace: 'nowrap',
		}}
	>
		{children}
	</div>
);

const Avatar: React.FC<{size: number; bg?: string; ring?: string}> = ({size, bg = C.crimson, ring = C.cream}) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: '50%',
			background: bg,
			border: `${Math.max(3, size * 0.06)}px solid ${ring}`,
			boxSizing: 'border-box',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			boxShadow: '0 5px 0 rgba(20,15,12,.4)',
		}}
	>
		<Glyph name="user" size={size * 0.62} stroke={14} />
	</div>
);

const Ticks: React.FC<{blue: number; size?: number}> = ({blue, size = 30}) => (
	<span style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: size, color: interpolate(blue, [0, 1], [0, 1]) > 0.5 ? '#34B7F1' : '#8C8C8C', letterSpacing: '-0.35em'}}>
		✓✓
	</span>
);

/* ============ S1 HOOK ============ */
export const Hook: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cam = ramp(f, 0, 24, 1.25, 1);
	const tile = pop(f, fps, lines[0][0].at);
	const paid = pop(f, fps, lines[0][1].at + 2);
	const wait = lines[1][0].at;
	const clock = pop(f, fps, wait + 1);
	const fade = ramp(f, wait, wait + 20, 0, 1, EASE_IN_OUT);
	const sway = Math.sin((f - wait) / 7) * 6 * fade;
	const cy = 1040;
	return (
		<AbsoluteFill style={{transform: `scale(${cam})`, transformOrigin: `${CX}px 45%`}}>
			<Starburst cx={CX} cy={cy} size={W * 0.8} scale={pop(f, fps, 2)} rot={f * 0.25} seed={3} />
			<Abs x={CX} y={cy}>
				<div style={{transform: `scale(${sc(tile) * (1 - 0.08 * fade)}) rotate(${-6 + sway}deg)`, filter: `grayscale(${0.75 * fade})`}}>
					<Tile size={360} icon="user" />
				</div>
			</Abs>
			<Abs x={CX + 175} y={cy - 190}>
				<Chip scale={paid} rot={-8} size={40}>
					PAID ✓
				</Chip>
			</Abs>
			<Starburst cx={CX - 190} cy={cy - 170} size={250} color={C.cursor} scale={clock} rot={-f} seed={13}>
				<div style={{transform: `rotate(${f * 6}deg)`}}>
					<Glyph name="clock" size={120} />
				</div>
			</Starburst>
			{/* "waiting..." dots under the customer */}
			<Abs x={CX} y={cy + 270}>
				<div style={{display: 'flex', gap: 26, opacity: fade}}>
					{[0, 1, 2].map((i) => (
						<div
							key={i}
							style={{
								width: 34,
								height: 34,
								borderRadius: '50%',
								background: C.ink,
								transform: `translateY(${Math.sin((f - i * 5) / 4) * 10}px)`,
							}}
						/>
					))}
				</div>
			</Abs>
			<Line words={lines[0]} y={L1} size={86} />
			<Line words={lines[1]} y={L2} size={92} />
			<Line words={lines[2]} y={L3} size={100} color={C.crimson} />
		</AbsoluteFill>
	);
};

/* ---------- Phone with a WhatsApp chat ---------- */
const Phone: React.FC<{bubble: number; ticks: number; badge: number; sendPress: number}> = ({bubble, ticks, badge, sendPress}) => {
	const pw = 470;
	const ph = 760;
	return (
		<div style={{width: pw, height: ph, position: 'relative', filter: CUTOUT_SHADOW}}>
			<div style={{position: 'absolute', inset: 0, borderRadius: 64, background: '#1b1716', padding: 16, boxSizing: 'border-box'}}>
				<div style={{width: '100%', height: '100%', borderRadius: 50, overflow: 'hidden', background: '#EFE6DA', position: 'relative'}}>
					{/* header */}
					<div style={{height: 120, background: '#127A43', display: 'flex', alignItems: 'center', gap: 18, padding: '30px 28px 0', boxSizing: 'border-box', direction: 'rtl'}}>
						<Avatar size={66} bg={C.crimson} />
						<div style={{fontFamily: AR_FONT, fontWeight: 900, fontSize: 36, color: '#fff'}}>عميلك</div>
					</div>
					{/* outgoing offer bubble */}
					<div
						style={{
							position: 'absolute',
							right: 26,
							top: 190,
							width: 340,
							transformOrigin: '100% 100%',
							transform: `translateY(${(1 - bubble) * 80}px) scale(${sc(bubble)})`,
							opacity: Math.min(1, sc(bubble) * 2),
							background: '#D9FDD3',
							borderRadius: '28px 6px 28px 28px',
							padding: '22px 24px 14px',
							boxShadow: '0 4px 0 rgba(20,15,12,.18)',
							direction: 'rtl',
						}}
					>
						<div style={{height: 150, borderRadius: 18, background: `linear-gradient(135deg, ${C.crimsonHi}, ${C.maroon})`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14}}>
							<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 76, color: C.cream, direction: 'ltr'}}>-20%</div>
						</div>
						<div style={{fontFamily: AR_FONT, fontWeight: 900, fontSize: 36, color: C.ink, lineHeight: 1.3}}>عرض خاص لك!</div>
						<div style={{fontFamily: AR_FONT, fontWeight: 900, fontSize: 26, color: '#5b524c', lineHeight: 1.4}}>خصم على طلبك الجاي</div>
						<div style={{textAlign: 'left', marginTop: 4}}>
							<Ticks blue={ticks} />
						</div>
					</div>
					{/* composer */}
					<div style={{position: 'absolute', left: 20, right: 20, bottom: 24, height: 84, display: 'flex', gap: 14, alignItems: 'center'}}>
						<div
							style={{
								width: 84,
								height: 84,
								borderRadius: '50%',
								background: C.green,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								transform: `scale(${1 - 0.12 * sendPress})`,
							}}
						>
							<Glyph name="send" size={46} stroke={16} />
						</div>
						<div style={{flex: 1, height: 70, borderRadius: 35, background: '#fff'}} />
					</div>
				</div>
			</div>
			<div style={{position: 'absolute', right: -70, top: -60, transform: `scale(${sc(badge)}) rotate(${12 * (1 - badge)}deg)`}}>
				<Tile size={170} icon="whatsapp" color="green" tilt={8} />
			</div>
		</div>
	);
};

/* ============ S2 SEND ============ */
export const Send: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const enter = spring({frame: f, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
	const clickAt = lines[0][1].at + 2;
	const bubble = pop(f, fps, clickAt + 3);
	const ticks = ramp(f, lines[1][1].at + 2, lines[1][1].at + 5, 0, 1);
	const badge = pop(f, fps, lines[1][1].at);
	const pcx = CX;
	const pcy = 1050;
	// send button tip position (phone is centred at pcx/pcy)
	const bx = pcx - 235 + 16 + 20 + 42;
	const by = pcy + 380 - 16 - 24 - 42;
	const curT = ramp(f, 0, clickAt - 1, 0, 1);
	const exitT = ramp(f, clickAt + 10, clickAt + 18, 0, 1, EASE_IN_OUT);
	const id = idle(f);
	return (
		<AbsoluteFill>
			<Starburst cx={pcx} cy={pcy} size={W * 0.9} scale={pop(f, fps, 0)} rot={-f * 0.3} seed={17} color={C.maroon} />
			<Abs x={pcx} y={pcy + (1 - enter) * 900}>
				<div style={{transform: `rotate(${-3 * enter}deg)`}}>
					<Phone bubble={bubble} ticks={ticks} badge={badge} sendPress={press(f, clickAt)} />
				</div>
			</Abs>
			<Line words={lines[0]} y={L1} size={94} />
			<Line words={lines[1]} y={L2} size={104} color={C.green} />
			<Cursor
				x={interpolate(curT, [0, 1], [W * 0.9, bx]) + exitT * 900}
				y={interpolate(curT, [0, 1], [H * 1.05, by]) + (f > clickAt + 6 ? id.dy : 0)}
				press={press(f, clickAt)}
				rot={id.rot}
			/>
		</AbsoluteFill>
	);
};

/* ============ S3 BROADCAST ============ */
export const Broadcast: React.FC<SceneProps> = ({lines, dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cy = 1010;
	const start = lines[1][0].at - 4;
	const rings = [
		{r: 250, n: 8},
		{r: 360, n: 12},
		{r: 470, n: 16},
	];
	const count = Math.round(interpolate(f, [start, start + 28], [0, 10000], {...CLAMP, easing: EASE_IN_OUT}));
	const pulse = ((f - start) % 18) / 18;
	const tile = pop(f, fps, 1);
	const spin = interpolate(f, [0, dur], [0, 14], CLAMP);
	let k = 0;
	return (
		<AbsoluteFill>
			{f > start ? (
				<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
					{[0, 1].map((j) => {
						const p = (pulse + j * 0.5) % 1;
						return <circle key={j} cx={CX} cy={cy} r={170 + p * 360} fill="none" stroke={C.green} strokeWidth={10 * (1 - p)} opacity={0.6 * (1 - p)} />;
					})}
				</svg>
			) : null}
			{rings.map((ring, ri) =>
				Array.from({length: ring.n}, (_, i) => {
					const idx = k++;
					const a = (i / ring.n) * Math.PI * 2 + ri * 0.3 + (spin * Math.PI) / 180;
					const at = start + idx * 0.7 + rand(idx) * 3;
					const s = pop(f, fps, at);
					const size = [86, 74, 62][ri];
					const bg = [C.crimson, C.maroon, C.green, '#C9A27A'][idx % 4];
					return (
						<Abs key={idx} x={CX + Math.cos(a) * ring.r} y={cy + Math.sin(a) * ring.r * 0.9}>
							<div style={{transform: `scale(${sc(s)})`}}>
								<Avatar size={size} bg={bg} />
							</div>
						</Abs>
					);
				}),
			)}
			<Abs x={CX} y={cy}>
				<div style={{transform: `scale(${sc(tile)}) rotate(${-8 + 8 * tile}deg)`}}>
					<Tile size={300} icon="whatsapp" color="green" />
				</div>
			</Abs>
			<Abs x={CX} y={1360}>
				<Chip bg={C.ink} size={48} scale={pop(f, fps, start)}>
					{count.toLocaleString('en-US')}+ SENT ✓✓
				</Chip>
			</Abs>
			<Line words={lines[0]} y={L1} size={100} />
			<Line words={lines[1]} y={L2} size={100} color={C.crimson} />
		</AbsoluteFill>
	);
};

/* ============ S4 META (official API) ============ */
export const Meta: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const cy = 920;
	const t = pop(f, fps, 0);
	const wmAt = lines[1][0].at;
	const wm = ramp(f, wmAt, wmAt + 6, 0, 1);
	const und = ramp(f, wmAt + 4, wmAt + 14, 0, 1);
	const tag = pop(f, fps, lines[1][1].at + 2);
	const lock = pop(f, fps, lines[1][1].at + 6);
	return (
		<AbsoluteFill>
			<Starburst cx={CX} cy={cy} size={W * 0.68} scale={pop(f, fps, 0)} rot={f * 0.4} seed={41} />
			<Abs x={CX} y={cy}>
				<div style={{transform: `scale(${sc(t)}) rotate(${-12 + 8 * t}deg)`}}>
					<Tile size={360} icon="infinity" />
				</div>
			</Abs>
			<Abs x={CX + 190} y={cy - 200}>
				<Chip scale={tag} rot={-7} size={38}>
					OFFICIAL ✓
				</Chip>
			</Abs>
			<Abs x={CX - 205} y={cy + 160}>
				<div
					style={{
						transform: `scale(${sc(lock)}) rotate(-10deg)`,
						width: 120,
						height: 120,
						borderRadius: '50%',
						background: C.green,
						border: `6px solid ${C.cream}`,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 8px 0 rgba(20,15,12,.45)',
					}}
				>
					<Glyph name="check" size={84} color="#fff" stroke={18} />
				</div>
			</Abs>
			<div
				style={{
					position: 'absolute',
					top: 1300,
					left: SAFE.left,
					right: W - SAFE.right,
					textAlign: 'center',
					fontFamily: WORDMARK_FONT,
					fontWeight: 900,
					fontSize: 76,
					letterSpacing: '.06em',
					color: C.ink,
					opacity: wm,
					filter: `blur(${18 * (1 - wm)}px)`,
					transform: `translateY(-50%) scale(${1.08 - 0.08 * wm})`,
					textShadow: TEXT_SHADOW,
				}}
			>
				META API
			</div>
			<svg width={W} height={40} style={{position: 'absolute', top: 1345, left: 0}}>
				<path d={`M${CX - 260} 20 Q ${CX} 8 ${CX + 260} 22`} stroke={C.crimson} strokeWidth={10} fill="none" strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - und} />
			</svg>
			<Line words={lines[0]} y={L1} size={100} />
			<Line words={lines[1]} y={L2} size={100} color={C.crimson} />
		</AbsoluteFill>
	);
};

/* ============ S5 TEMPLATES ============ */
const TemplateCard: React.FC<{w: number; h: number; title: string}> = ({w, h, title}) => (
	<div
		style={{
			width: w,
			height: h,
			borderRadius: w * 0.07,
			background: C.cardFrame,
			border: `6px solid ${C.crimson}`,
			boxSizing: 'border-box',
			padding: w * 0.07,
			display: 'flex',
			flexDirection: 'column',
			gap: w * 0.05,
			filter: CUTOUT_SHADOW,
		}}
	>
		<div style={{display: 'flex', alignItems: 'center', gap: 12}}>
			<div style={{width: w * 0.2, height: w * 0.2, borderRadius: '30%', background: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<Glyph name="template" size={w * 0.15} stroke={16} />
			</div>
			<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: w * 0.085, color: C.ink}}>{title}</div>
		</div>
		<div style={{flex: 1, borderRadius: w * 0.05, background: `radial-gradient(circle at 40% 35%, #F1DDBC 0%, ${C.peach} 60%, #D9B98F 100%)`}} />
		{[0.9, 0.7, 0.5].map((v, i) => (
			<div key={i} style={{height: w * 0.045, width: `${v * 100}%`, borderRadius: 99, background: '#D6CCBE'}} />
		))}
		<div style={{height: w * 0.14, borderRadius: w * 0.07, background: C.crimson}} />
	</div>
);

export const Templates: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const okAt = lines[0][1].at;
	const cards = [
		{dx: -285, rot: -9, title: 'WELCOME', at: 0},
		{dx: 285, rot: 9, title: 'REMINDER', at: 4},
		{dx: 0, rot: 0, title: 'OFFER', at: 8},
	];
	const cy = 990;
	return (
		<AbsoluteFill>
			{cards.map((c, i) => {
				const s = pop(f, fps, c.at);
				const st = pop(f, fps, okAt + i * 3);
				return (
					<Abs key={i} x={CX + c.dx} y={cy + (i < 2 ? 40 : 0)}>
						<div style={{transform: `translateY(${(1 - s) * 140}px) scale(${sc(s)}) rotate(${c.rot}deg)`, position: 'relative'}}>
							<TemplateCard w={290} h={460} title={c.title} />
							<div
								style={{
									position: 'absolute',
									left: '50%',
									top: '44%',
									transform: `translate(-50%,-50%) rotate(-14deg) scale(${sc(st) * 1}) `,
									opacity: Math.min(1, sc(st) * 3),
									border: `6px solid ${C.green}`,
									color: C.green,
									background: 'rgba(240,235,227,.92)',
									fontFamily: UI_FONT,
									fontWeight: 800,
									fontSize: 34,
									padding: '8px 16px',
									borderRadius: 12,
									whiteSpace: 'nowrap',
								}}
							>
								APPROVED ✓
							</div>
						</div>
					</Abs>
				);
			})}
			<Line words={lines[0]} y={430} size={104} />
		</AbsoluteFill>
	);
};

/* ============ S6 INBOX ============ */
export const Inbox: React.FC<SceneProps> = ({lines, dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const panel = pop(f, fps, 0);
	const pw = 600;
	const ph = 520;
	const px = CX;
	const py = 975;
	const teamAt = lines[1][0].at;
	const replyAt = lines[1][2].at;
	const oneAt = lines[2][1].at;
	const merge = pop(f, fps, oneAt);
	const agents = [-230, 0, 230];
	const rows = [
		{n: 'Sara', bg: C.crimson},
		{n: 'Omar', bg: C.green},
		{n: 'Lina', bg: '#C9A27A'},
		{n: 'Ali', bg: C.maroon},
	];
	return (
		<AbsoluteFill>
			{agents.map((dx, i) => (
				<HandLine
					key={i}
					d={`M ${W + px + dx} 1340 C ${W + px + dx} 1300, ${W + px + dx * 0.4} ${py + ph / 2 + 40}, ${W + px + dx * 0.2} ${py + ph / 2 - 10}`}
					progress={ramp(f, teamAt + 4 + i * 3, teamAt + 14 + i * 3, 0, 1, (t) => t)}
				/>
			))}
			<Abs x={px} y={py}>
				<div
					style={{
						transform: `translateY(${(1 - panel) * 120}px) scale(${sc(panel) * (1 + 0.04 * Math.max(0, merge - 1) + 0.03 * sc(merge))})`,
						width: pw,
						height: ph,
						borderRadius: 40,
						background: C.cardFrame,
						border: `7px solid ${C.crimson}`,
						boxSizing: 'border-box',
						filter: CUTOUT_SHADOW,
						overflow: 'hidden',
					}}
				>
					<div style={{height: 96, background: C.crimson, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px'}}>
						<div style={{fontFamily: WORDMARK_FONT, fontWeight: 900, fontSize: 40, letterSpacing: '.06em', color: C.cream}}>INBOX</div>
						<Glyph name="inbox" size={62} stroke={16} />
					</div>
					{rows.map((r, i) => {
						const s = ramp(f, 4 + i * 4, 12 + i * 4, 0, 1);
						const rep = ramp(f, replyAt + i * 4, replyAt + i * 4 + 4, 0, 1);
						return (
							<div
								key={i}
								style={{
									height: 100,
									display: 'flex',
									alignItems: 'center',
									gap: 20,
									padding: '0 26px',
									borderBottom: '3px solid #E0D7CA',
									opacity: s,
									transform: `translateX(${(1 - s) * 80}px)`,
								}}
							>
								<Avatar size={68} bg={r.bg} />
								<div style={{flex: 1}}>
									<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 30, color: C.ink}}>{r.n}</div>
									<div style={{height: 14, width: `${60 + i * 8}%`, borderRadius: 99, background: '#D6CCBE', marginTop: 8}} />
								</div>
								<div style={{position: 'relative', width: 90, height: 50}}>
									<div style={{position: 'absolute', right: 0, top: 6, width: 38, height: 38, borderRadius: '50%', background: C.green, opacity: 1 - rep, fontFamily: UI_FONT, fontWeight: 800, fontSize: 24, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
										{i + 1}
									</div>
									<div style={{position: 'absolute', right: 0, top: 0, opacity: rep, transform: `scale(${0.6 + 0.4 * rep})`}}>
										<Ticks blue={1} size={40} />
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</Abs>
			{agents.map((dx, i) => {
				const s = pop(f, fps, teamAt + i * 3);
				return (
					<Abs key={i} x={px + dx} y={1335}>
						<div style={{transform: `scale(${sc(s)})`}}>
							<Avatar size={120} bg={[C.ink, C.crimson, C.green][i]} />
						</div>
					</Abs>
				);
			})}
			<Abs x={px + pw / 2 - 10} y={py - ph / 2 - 10}>
				<Chip bg={C.ink} size={36} rot={6} scale={merge}>
					1 PLACE
				</Chip>
			</Abs>
			<Line words={lines[0]} y={L1} size={90} />
			<Line words={lines[1]} y={L2} size={88} />
			<Line words={lines[2]} y={L3} size={88} color={C.crimson} />
		</AbsoluteFill>
	);
};

/* ============ S7 PRICE ============ */
export const Price: React.FC<SceneProps> = ({lines}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const hit = lines[1][1].at;
	const k = spring({frame: f - hit, fps, config: {damping: 9, stiffness: 220, mass: 0.6}});
	const shake = f >= hit && f < hit + 8 ? (1 - (f - hit) / 8) * 12 : 0;
	const sx = (rand(f * 1.3) - 0.5) * 2 * shake;
	const sy = (rand(f * 2.7) - 0.5) * 2 * shake;
	const cy = 980;
	const price = pop(f, fps, hit);
	const mo = pop(f, fps, lines[2][1].at + 2);
	return (
		<AbsoluteFill style={{transform: `translate(${sx}px,${sy}px)`}}>
			<Starburst cx={CX} cy={cy} size={860} scale={pop(f, fps, 0)} rot={f * 0.6} seed={57} />
			<Starburst cx={CX} cy={cy} size={660} color={C.cursor} scale={pop(f, fps, hit - 1)} rot={-f * 1.1} seed={77} />
			<Abs x={CX} y={cy - 70}>
				<div
					style={{
						transform: `scale(${sc(price) * (1 + 0.06 * sc(k))}) rotate(-4deg)`,
						fontFamily: UI_FONT,
						fontWeight: 800,
						fontSize: 230,
						lineHeight: 1,
						color: C.cream,
						textShadow: TEXT_SHADOW_RED,
						letterSpacing: '-0.03em',
					}}
				>
					$20
				</div>
			</Abs>
			<Abs x={CX + 230} y={cy + 250}>
				<Chip size={40} rot={-8} scale={mo}>
					/ MONTH
				</Chip>
			</Abs>
			<Line words={lines[2]} y={cy + 120} size={92} color={C.cream} onRed />
			<Line words={lines[0]} y={L1} size={92} />
			<Line words={lines[1]} y={L2} size={92} />
		</AbsoluteFill>
	);
};

/* ============ S8 CTA ============ */
export const Cta: React.FC<SceneProps> = ({lines, dur}) => {
	const f = useCurrentFrame();
	const {fps} = useVideoConfig();
	const swap = lines[2][0].at - 6;
	const outA = ramp(f, swap, swap + 6, 0, 1, EASE_IN_OUT);
	const inB = ramp(f, swap + 3, swap + 9, 0, 1);
	const push = interpolate(f, [0, dur], [1, 1.05], CLAMP);
	// phase A: the waiting customer again
	const tileA = pop(f, fps, 2);
	// phase B: subscribe button + launch
	const b = pop(f, fps, swap + 4);
	const clickAt = lines[2][1].at + 4;
	const cl = press(f, clickAt);
	const done = ramp(f, clickAt + 2, clickAt + 6, 0, 1);
	const curT = ramp(f, swap + 6, clickAt - 1, 0, 1);
	const exitT = ramp(f, clickAt + 10, clickAt + 18, 0, 1, EASE_IN_OUT);
	const launchAt = lines[3][0].at;
	const plane = spring({frame: f - launchAt + 2, fps, config: {damping: 14, stiffness: 160, mass: 0.7}});
	const fly = ramp(f, lines[3][1].at + 6, lines[3][1].at + 30, 0, 1, EASE_IN_OUT);
	const go = pop(f, fps, lines[3][1].at + 1);
	const bx = CX;
	const by = 900;
	const id = idle(f);
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
			{/* phase A */}
			<AbsoluteFill style={{opacity: 1 - outA, filter: outA > 0.01 ? `blur(${20 * outA}px)` : undefined}}>
				<Abs x={CX} y={980}>
					<div style={{transform: `scale(${sc(tileA)}) rotate(${Math.sin(f / 7) * 5}deg)`, filter: 'grayscale(.7)'}}>
						<Tile size={320} icon="user" />
					</div>
				</Abs>
				<Starburst cx={CX + 170} cy={820} size={220} color={C.cursor} scale={pop(f, fps, 6)} rot={f} seed={13}>
					<div style={{transform: `rotate(${f * 6}deg)`}}>
						<Glyph name="clock" size={104} />
					</div>
				</Starburst>
				<Line words={lines[0]} y={L1} size={92} />
				<Line words={lines[1]} y={L2} size={100} color={C.crimson} />
			</AbsoluteFill>
			{/* phase B */}
			{f >= swap ? (
				<AbsoluteFill style={{opacity: inB}}>
					<Starburst cx={CX + 210} cy={1130} size={300} color={C.cursor} scale={go} rot={f} seed={88}>
						<div style={{fontFamily: UI_FONT, fontWeight: 800, fontSize: 76, color: C.cream, transform: 'rotate(8deg)'}}>GO!</div>
					</Starburst>
					<Abs x={CX - 190 + fly * 60} y={1170 - fly * 50}>
						<div style={{transform: `scale(${sc(plane) * (1 - 0.15 * fly)}) rotate(${-10 + 20 * fly}deg)`}}>
							<Tile size={230} icon="send" color="green" />
						</div>
					</Abs>
					<Abs x={bx} y={by}>
						<div
							style={{
								transform: `scale(${sc(b) * (1 - 0.06 * cl)})`,
								width: 640,
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
								fontSize: 64,
								color: C.cream,
								textShadow: TEXT_SHADOW_RED,
								direction: 'rtl',
							}}
						>
							<span style={{position: 'absolute', opacity: 1 - done, filter: `blur(${10 * done}px)`}}>اشترك الحين +</span>
							<span style={{position: 'absolute', opacity: done, filter: `blur(${10 * (1 - done)}px)`}}>✓ تم الاشتراك</span>
						</div>
					</Abs>
					<Line words={lines[2]} y={L1 + 45} size={100} />
					<Line words={lines[3]} y={L2 + 55} size={106} color={C.crimson} />
					{f >= swap + 6 ? (
						<Cursor
							x={interpolate(curT, [0, 1], [W * 0.95, bx + 90]) + exitT * 900}
							y={interpolate(curT, [0, 1], [H * 1.02, by + 30]) + (f > clickAt + 6 ? id.dy : 0)}
							press={cl}
							rot={id.rot}
						/>
					) : null}
				</AbsoluteFill>
			) : null}
		</AbsoluteFill>
	);
};

export const TEMPLATES: Record<string, React.FC<SceneProps>> = {
	HOOK: Hook,
	SEND: Send,
	BROADCAST: Broadcast,
	META: Meta,
	TEMPLATES: Templates,
	INBOX: Inbox,
	PRICE: Price,
	CTA: Cta,
};
