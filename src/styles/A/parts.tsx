import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {rand} from '../../shared/easing';
import {UI_FONT, WORDMARK_FONT} from '../../shared/fonts';
import {C, CUTOUT_SHADOW, H, TILE_SHADOW, W} from './tokens';

/* ---------- Paper: base + hotspot + vignette + halftone + specks ---------- */
const Halftone: React.FC<{id: string; opacity: number}> = ({id, opacity}) => (
	<svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'multiply', opacity}}>
		<defs>
			<pattern id={id} width={4} height={4} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
				<circle cx={2} cy={2} r={0.8} fill="#000" />
			</pattern>
		</defs>
		<rect width={W} height={H} fill={`url(#${id})`} />
	</svg>
);

export const Paper: React.FC = () => {
	const specks = Array.from({length: 16}, (_, i) => ({
		x: rand(i * 3.1) * W,
		y: rand(i * 7.7 + 1) * H,
		r: 1 + rand(i * 5.3) * 2.2,
		o: 0.18 + rand(i * 2.2) * 0.3,
	}));
	return (
		<AbsoluteFill
			style={{
				background: `radial-gradient(ellipse 70% 55% at 50% 45%, ${C.paperLight} 0%, ${C.paper} 55%, ${C.paperDark} 100%)`,
			}}
		>
			<AbsoluteFill
				style={{background: 'radial-gradient(ellipse at 50% 48%, rgba(0,0,0,0) 55%, rgba(60,45,30,.35) 100%)'}}
			/>
			<Halftone id="paperHT" opacity={0.06} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0}}>
				{specks.map((s, i) => (
					<circle key={i} cx={s.x} cy={s.y} r={s.r} fill={C.ink} opacity={s.o} />
				))}
			</svg>
		</AbsoluteFill>
	);
};

/* ---------- Grade layer above everything ---------- */
export const GradeOverlay: React.FC = () => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<Halftone id="gradeHT" opacity={0.06} />
			<svg width={W} height={H} style={{position: 'absolute', inset: 0, mixBlendMode: 'soft-light', opacity: 0.08 * 2.2}}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={seed} stitchTiles="stitch" />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width={W} height={H} filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};

/* ---------- Starburst (14 irregular spikes) ---------- */
export const Starburst: React.FC<{
	cx: number;
	cy: number;
	size: number;
	color?: string;
	spikes?: number;
	seed?: number;
	rot?: number;
	scale?: number;
	children?: React.ReactNode;
}> = ({cx, cy, size, color = C.maroon, spikes = 14, seed = 1, rot = 0, scale = 1, children}) => {
	const R = size / 2;
	const pts: string[] = [];
	for (let i = 0; i < spikes * 2; i++) {
		const a = (i / (spikes * 2)) * Math.PI * 2 + (rand(seed + i) - 0.5) * 0.12;
		const r = i % 2 === 0 ? R * (0.82 + rand(seed * 3 + i) * 0.18) : R * (0.5 + rand(seed * 5 + i) * 0.12);
		pts.push(`${R + Math.cos(a) * r},${R + Math.sin(a) * r}`);
	}
	return (
		<div
			style={{
				position: 'absolute',
				left: cx - R,
				top: cy - R,
				width: size,
				height: size,
				transform: `scale(${scale})`,
			}}
		>
			<svg width={size} height={size} style={{position: 'absolute', inset: 0, filter: CUTOUT_SHADOW, transform: `rotate(${rot}deg)`}}>
				<polygon points={pts.join(' ')} fill={color} />
			</svg>
			{children ? (
				<div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
					{children}
				</div>
			) : null}
		</div>
	);
};

/* ---------- 3D matte black cursor (tip = x,y) ---------- */
export const Cursor: React.FC<{x: number; y: number; press?: number; rot?: number; opacity?: number}> = ({
	x,
	y,
	press = 0,
	rot = 0,
	opacity = 1,
}) => {
	const h = H * 0.12;
	const w = h * 0.72;
	const s = 1 - 0.14 * press;
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				width: w,
				height: h,
				transformOrigin: '0 0',
				transform: `rotate(${rot}deg) scale(${s})`,
				opacity,
				filter: 'drop-shadow(10px 18px 14px rgba(20,12,8,.45)) drop-shadow(2px 4px 3px rgba(20,12,8,.5))',
			}}
		>
			<svg viewBox="0 0 72 100" width={w} height={h}>
				<defs>
					<linearGradient id="curG" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#3a3a3a" />
						<stop offset="0.45" stopColor="#1a1a1a" />
						<stop offset="1" stopColor="#070707" />
					</linearGradient>
					<filter id="curTex">
						<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="1" seed="4" />
						<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .07 0" />
						<feComposite in2="SourceGraphic" operator="in" />
					</filter>
				</defs>
				<path
					d="M4 3 L4 80 L22 64 L34 92 L48 86 L36 59 L60 59 Z"
					fill="url(#curG)"
					stroke="#141414"
					strokeWidth="3"
					strokeLinejoin="round"
				/>
				<path d="M4 3 L4 80 L22 64 L34 92 L48 86 L36 59 L60 59 Z" filter="url(#curTex)" />
				<path d="M8 12 L8 70 L20 59" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2.2" strokeLinecap="round" />
			</svg>
		</div>
	);
};

/* ---------- Cream line glyphs ---------- */
export const Glyph: React.FC<{name: string; size: number; color?: string; stroke?: number}> = ({
	name,
	size,
	color = C.cream,
	stroke = 11,
}) => {
	const p = {fill: 'none', stroke: color, strokeWidth: stroke, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};
	let g: React.ReactNode = null;
	switch (name) {
		case 'transitions':
			g = (
				<>
					<rect x="30" y="52" width="92" height="72" rx="12" {...p} />
					<rect x="78" y="86" width="92" height="72" rx="12" {...p} fill={C.crimson} />
					<path d="M44 156 Q60 176 92 172" {...p} />
					<path d="M84 162 L94 172 L82 182" {...p} />
				</>
			);
			break;
		case 'motion':
			g = (
				<>
					<path d="M36 150 C70 150 70 60 110 60 S150 110 168 60" {...p} />
					<circle cx="168" cy="60" r="14" fill={color} />
					<path d="M26 104 L58 104 M20 126 L46 126 M32 82 L56 82" {...p} strokeWidth={stroke * 0.8} />
				</>
			);
			break;
		case 'sound':
			g = (
				<>
					{[34, 62, 90, 118, 146, 174].map((x, i) => {
						const hh = [40, 90, 130, 70, 110, 50][i];
						return <path key={i} d={`M${x} ${100 - hh / 2} L${x} ${100 + hh / 2}`} {...p} />;
					})}
				</>
			);
			break;
		case 'prompt':
			g = (
				<>
					<path d="M30 46 H170 A14 14 0 0 1 184 60 V132 A14 14 0 0 1 170 146 H88 L56 172 V146 H30 A14 14 0 0 1 16 132 V60 A14 14 0 0 1 30 46 Z" {...p} />
					<path d="M52 80 L76 98 L52 116" {...p} />
					<path d="M92 118 H138" {...p} />
				</>
			);
			break;
		case 'skill':
			g = (
				<>
					<path d="M112 20 L52 112 H98 L86 180 L150 84 H104 Z" {...p} />
				</>
			);
			break;
		case 'ai':
			g = (
				<>
					<rect x="46" y="46" width="108" height="108" rx="16" {...p} />
					{[72, 100, 128].map((v) => (
						<g key={v}>
							<path d={`M${v} 22 V46 M${v} 154 V178 M22 ${v} H46 M154 ${v} H178`} {...p} strokeWidth={stroke * 0.8} />
						</g>
					))}
					<text x="100" y="118" textAnchor="middle" fontFamily={WORDMARK_FONT} fontWeight={900} fontSize="50" fill={color}>
						AI
					</text>
				</>
			);
			break;
		case 'play':
			g = <path d="M72 50 L150 100 L72 150 Z" fill={color} stroke={color} strokeWidth={stroke} strokeLinejoin="round" />;
			break;
		case 'check':
			g = <path d="M50 104 L86 140 L152 64" {...p} />;
			break;
		case 'user':
			g = (
				<>
					<circle cx="100" cy="74" r="34" {...p} />
					<path d="M38 168 C42 128 70 114 100 114 S158 128 162 168" {...p} />
				</>
			);
			break;
		case 'whatsapp':
			g = (
				<>
					<path d="M100 26 A74 74 0 1 1 52 156 L26 174 L38 138 A74 74 0 0 1 100 26 Z" {...p} />
					<path
						d="M74 66 C66 66 62 76 64 86 C70 112 90 132 116 138 C126 140 136 136 136 128 L136 118 L116 110 L108 120 C96 114 86 104 80 92 L90 84 L82 64 Z"
						fill={color}
						stroke={color}
						strokeWidth={stroke * 0.4}
						strokeLinejoin="round"
					/>
				</>
			);
			break;
		case 'clock':
			g = (
				<>
					<circle cx="100" cy="100" r="70" {...p} />
					<path d="M100 56 V100 L132 118" {...p} />
				</>
			);
			break;
		case 'infinity':
			g = <path d="M100 100 C80 62 30 62 30 100 C30 138 80 138 100 100 C120 62 170 62 170 100 C170 138 120 138 100 100 Z" {...p} />;
			break;
		case 'template':
			g = (
				<>
					<path d="M50 24 H124 L154 54 V176 H50 Z" {...p} />
					<path d="M74 82 H130 M74 108 H130 M74 134 H108" {...p} strokeWidth={stroke * 0.8} />
				</>
			);
			break;
		case 'inbox':
			g = (
				<>
					<path d="M30 110 L56 40 H144 L170 110 V164 H30 Z" {...p} />
					<path d="M30 110 H74 L84 132 H116 L126 110 H170" {...p} />
				</>
			);
			break;
		case 'camera':
			g = (
				<>
					<path d="M30 66 H64 L78 46 H122 L136 66 H170 A10 10 0 0 1 180 76 V154 A10 10 0 0 1 170 164 H30 A10 10 0 0 1 20 154 V76 A10 10 0 0 1 30 66 Z" {...p} />
					<circle cx="100" cy="114" r="30" {...p} />
				</>
			);
			break;
		case 'sun':
			g = (
				<>
					<circle cx="100" cy="100" r="36" {...p} />
					{Array.from({length: 8}, (_, i) => {
						const a = (i / 8) * Math.PI * 2;
						return (
							<path
								key={i}
								d={`M${100 + Math.cos(a) * 56} ${100 + Math.sin(a) * 56} L${100 + Math.cos(a) * 80} ${100 + Math.sin(a) * 80}`}
								{...p}
							/>
						);
					})}
				</>
			);
			break;
		case 'send':
			g = (
				<>
					<path d="M24 98 L176 30 L132 172 L98 116 Z" {...p} />
					<path d="M98 116 L176 30" {...p} />
				</>
			);
			break;
		default:
			g = null;
	}
	return (
		<svg viewBox="0 0 200 200" width={size} height={size} style={{overflow: 'visible'}}>
			{g}
		</svg>
	);
};

/* ---------- Crimson squircle tile with cream rim ---------- */
const TILE_FILL: Record<string, string> = {
	crimson: `linear-gradient(155deg, ${C.crimsonHi} 0%, ${C.crimson} 45%, #8f0f16 100%)`,
	green: `linear-gradient(155deg, #2DB866 0%, ${C.green} 45%, #137a3e 100%)`,
};

export const Tile: React.FC<{size: number; icon: string; tilt?: number; color?: 'crimson' | 'green'; children?: React.ReactNode}> = ({
	size,
	icon,
	tilt = 0,
	color = 'crimson',
	children,
}) => (
	<div style={{width: size, height: size, transform: `rotate(${tilt}deg)`, filter: TILE_SHADOW}}>
		<div
			style={{
				width: size,
				height: size,
				borderRadius: '22%',
				background: TILE_FILL[color],
				border: `${size * 0.035}px solid ${C.cream}`,
				boxSizing: 'border-box',
				boxShadow: `inset 0 ${size * 0.03}px 0 rgba(255,255,255,.18), inset 0 -${size * 0.04}px ${size * 0.05}px rgba(0,0,0,.25)`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			{children ?? <Glyph name={icon} size={size * 0.62} />}
		</div>
	</div>
);

/* ---------- Video card (product-card language) ---------- */
export const VideoCard: React.FC<{
	w: number;
	h: number;
	views?: string;
	icon?: string;
	selected?: number;
	gray?: number;
	label?: string;
}> = ({w, h, views, icon = 'play', selected = 0, gray = 0, label}) => {
	const r = w * 0.06;
	return (
		<div style={{width: w, height: h, filter: `${CUTOUT_SHADOW} grayscale(${gray})`}}>
			<div
				style={{
					width: w,
					height: h,
					borderRadius: r,
					background: C.cardFrame,
					border: `${6 + selected * 3}px solid ${C.crimson}`,
					boxSizing: 'border-box',
					padding: w * 0.055,
					display: 'flex',
					flexDirection: 'column',
					gap: w * 0.045,
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						flex: 1,
						borderRadius: r * 0.6,
						background: `radial-gradient(circle at 40% 35%, #F1DDBC 0%, ${C.peach} 55%, #D9B98F 100%)`,
						position: 'relative',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							width: w * 0.42,
							height: w * 0.42,
							borderRadius: '50%',
							background: C.crimson,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							boxShadow: '0 8px 0 rgba(20,15,12,.35)',
						}}
					>
						<Glyph name={icon} size={w * 0.3} stroke={icon === 'play' ? 11 : 13} />
					</div>
					{/* heart / eye corner icons */}
					<svg viewBox="0 0 24 24" width={w * 0.12} style={{position: 'absolute', top: w * 0.04, right: w * 0.04}}>
						<path d="M12 21 C5 15 2 11.5 2 8 A5 5 0 0 1 12 6 A5 5 0 0 1 22 8 C22 11.5 19 15 12 21Z" fill={C.crimson} />
					</svg>
					<svg viewBox="0 0 24 24" width={w * 0.12} style={{position: 'absolute', top: w * 0.04, left: w * 0.04}}>
						<path d="M1 12 C5 5 19 5 23 12 C19 19 5 19 1 12Z" fill="none" stroke={C.ink} strokeWidth="2.2" />
						<circle cx="12" cy="12" r="3.5" fill={C.ink} />
					</svg>
					<div style={{position: 'absolute', inset: 0, background: C.crimson, opacity: 0.25 * selected, mixBlendMode: 'multiply'}} />
				</div>
				{/* timeline */}
				<div style={{height: w * 0.035, borderRadius: 99, background: '#D6CCBE', overflow: 'hidden'}}>
					<div style={{width: '64%', height: '100%', background: C.crimson}} />
				</div>
				<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
					<div
						style={{
							fontFamily: UI_FONT,
							fontWeight: 800,
							fontSize: w * (label ? (label.length > 8 ? 0.068 : 0.09) : 0.14),
							color: C.ink,
							letterSpacing: '-0.01em',
						}}
					>
						{label ?? views}
					</div>
					<div style={{display: 'flex', gap: w * 0.015}}>
						{[0, 1, 2, 3, 4].map((i) => (
							<svg key={i} viewBox="0 0 24 24" width={w * 0.06}>
								<path d="M12 2 L15 9 L22 9.5 L16.5 14 L18.5 21 L12 17 L5.5 21 L7.5 14 L2 9.5 L9 9Z" fill={C.crimson} />
							</svg>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

/* ---------- Concrete pillar + thermal receipt ---------- */
export const Pillar: React.FC<{lines: string[]; total: string}> = ({lines, total}) => {
	const x0 = W * 0.32;
	const x1 = W * 0.7;
	const top = H * 0.58;
	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: x0,
					width: x1 - x0,
					top,
					bottom: -40,
					background: 'linear-gradient(90deg, #8f8a83 0%, #b9b3aa 30%, #c9c3ba 55%, #9d978f 100%)',
					filter: CUTOUT_SHADOW,
				}}
			>
				<div style={{position: 'absolute', inset: 0, background: 'linear-gradient(180deg,#d8d2c9 0,#d8d2c9 26px,rgba(0,0,0,0) 26px)'}} />
			</div>
			<div
				style={{
					position: 'absolute',
					left: x0 + 40,
					width: x1 - x0 - 80,
					top: top - 18,
					height: 470,
					background: 'linear-gradient(180deg,#f6f2ea,#ece6db)',
					transform: 'rotate(-1.5deg)',
					filter: CUTOUT_SHADOW,
					fontFamily: "'Courier New', 'Courier Prime', monospace",
					fontWeight: 700,
					color: '#3a332e',
					padding: '26px 26px',
					boxSizing: 'border-box',
					fontSize: 24,
					lineHeight: 1.55,
					clipPath:
						'polygon(0 0,100% 0,100% 96%,95% 100%,90% 96%,85% 100%,80% 96%,75% 100%,70% 96%,65% 100%,60% 96%,55% 100%,50% 96%,45% 100%,40% 96%,35% 100%,30% 96%,25% 100%,20% 96%,15% 100%,10% 96%,5% 100%,0 96%)',
				}}
			>
				<div style={{textAlign: 'center', fontSize: 34, letterSpacing: '.12em'}}>SALES</div>
				<div style={{borderTop: '3px dashed #6b625a', margin: '10px 0'}} />
				{lines.map((l, i) => (
					<div key={i} style={{display: 'flex', justifyContent: 'space-between'}}>
						<span>{l}</span>
						<span>✓</span>
					</div>
				))}
				<div style={{borderTop: '3px dashed #6b625a', margin: '10px 0'}} />
				<div style={{display: 'flex', justifyContent: 'space-between'}}>
					<span>SUBTOTAL</span>
					<span>1 PROMPT</span>
				</div>
				<div style={{display: 'flex', justifyContent: 'space-between', fontSize: 30, color: C.crimson}}>
					<span>TOTAL</span>
					<span>{total}</span>
				</div>
			</div>
		</>
	);
};

/* ---------- Wobbly hand-drawn connector ---------- */
export const HandLine: React.FC<{d: string; progress: number; width?: number}> = ({d, progress, width = 5}) => (
	<svg width={W * 3} height={H} style={{position: 'absolute', left: -W, top: 0, overflow: 'visible'}}>
		<path
			d={d}
			fill="none"
			stroke="#2A2522"
			strokeWidth={width}
			strokeLinecap="round"
			pathLength={1}
			strokeDasharray="1 1"
			strokeDashoffset={1 - progress}
		/>
	</svg>
);

/* ---------- Copper magnifier ---------- */
export const Magnifier: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
	<div style={{position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, pointerEvents: 'none'}}>
		{/* handle */}
		<div
			style={{
				position: 'absolute',
				left: r * 1.55,
				top: r * 1.62,
				width: r * 0.34,
				height: r * 1.5,
				borderRadius: r * 0.1,
				transform: 'rotate(-45deg)',
				transformOrigin: '50% 0',
				background: 'linear-gradient(90deg,#2b1a14,#5a3a2c 45%,#1d110c)',
				filter: CUTOUT_SHADOW,
			}}
		/>
		<div
			style={{
				position: 'absolute',
				inset: -r * 0.12,
				borderRadius: '50%',
				border: `${r * 0.12}px solid #B06A3B`,
				boxShadow: `inset 0 0 0 ${r * 0.03}px #E0A070, 0 14px 18px rgba(30,20,15,.35), inset 0 10px 30px rgba(255,255,255,.35)`,
				background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.28), rgba(255,255,255,0) 45%)',
			}}
		/>
	</div>
);
