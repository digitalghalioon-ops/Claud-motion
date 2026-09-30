import React from 'react';
import {AbsoluteFill} from 'remotion';
import {rand} from '../shared/easing';

// Virtual studio plate, "blue" theme. Authored in a 1080x1920 world, rendered at 2x as a still.
// Camera: chest height, eye-level, straight-on, symmetrical.
const W = 1080;
const H = 1920;
const HORIZON = 1180; // wall/floor seam (hidden behind subject most of the time)

const Candle: React.FC<{x: number; y: number; h: number; s?: number}> = ({x, y, h, s = 1}) => (
	<g transform={`translate(${x},${y}) scale(${s})`}>
		<ellipse cx={0} cy={-h - 16} rx={46} ry={60} fill="url(#flameGlow)" />
		<rect x={-9} y={-h} width={18} height={h} rx={3} fill="url(#wax)" />
		<path d={`M0 ${-h - 22} C 5 ${-h - 12} 5 ${-h - 4} 0 ${-h - 2} C -5 ${-h - 4} -5 ${-h - 12} 0 ${-h - 22}Z`} fill="#FFE2A8" />
	</g>
);

const Lamp: React.FC<{x: number; y: number}> = ({x, y}) => (
	<g transform={`translate(${x},${y})`}>
		<ellipse cx={0} cy={-40} rx={110} ry={90} fill="url(#lampGlow)" />
		<rect x={-4} y={-38} width={8} height={38} fill="#2a3338" />
		<ellipse cx={0} cy={0} rx={22} ry={5} fill="#1c2226" />
		<path d="M-30 -38 L30 -38 L20 -74 L-20 -74Z" fill="#F3C98A" opacity={0.95} />
	</g>
);

const Books: React.FC<{x: number; y: number; n: number; seed: number}> = ({x, y, n, seed}) => {
	let cx = x;
	const out: React.ReactNode[] = [];
	for (let i = 0; i < n; i++) {
		const w = 10 + rand(seed + i) * 10;
		const h = 46 + rand(seed + i * 3) * 30;
		const c = ['#123b44', '#0d2a31', '#1d4f57', '#3a3226', '#20262b'][Math.floor(rand(seed + i * 7) * 5)];
		out.push(<rect key={i} x={cx} y={y - h} width={w} height={h} fill={c} stroke="#061216" strokeWidth={1} />);
		cx += w + 1;
	}
	return <g>{out}</g>;
};

const Shelf: React.FC<{x: number; flip?: boolean}> = ({x, flip}) => {
	const rows = [470, 690, 910, 1130];
	return (
		<g transform={flip ? `translate(${W},0) scale(-1,1)` : undefined}>
			{/* uprights */}
			<rect x={x} y={300} width={8} height={900} fill="#0f171a" />
			<rect x={x + 242} y={300} width={8} height={900} fill="#0f171a" />
			{rows.map((ry, i) => (
				<g key={ry}>
					<rect x={x - 6} y={ry} width={262} height={10} fill="#1a2429" />
					<rect x={x - 6} y={ry} width={262} height={2} fill="#3d5a63" opacity={0.7} />
					<rect x={x - 6} y={ry + 10} width={262} height={26} fill="url(#shelfShadow)" />
					{i === 0 && <><Candle x={x + 40} y={ry} h={60} /><Candle x={x + 70} y={ry} h={38} s={0.9} /><rect x={x + 150} y={ry - 90} width={70} height={90} fill="#0c1b20" stroke="#2b4d55" strokeWidth={3} /><rect x={x + 160} y={ry - 80} width={50} height={70} fill="url(#art1)" /></>}
					{i === 1 && <><Books x={x + 20} y={ry} n={8} seed={11 + (flip ? 50 : 0)} /><Lamp x={x + 190} y={ry} /></>}
					{i === 2 && <><circle cx={x + 60} cy={ry - 34} r={34} fill="url(#vase)" /><Candle x={x + 150} y={ry} h={52} /><Candle x={x + 182} y={ry} h={30} s={0.85} /></>}
					{i === 3 && <Books x={x + 70} y={ry} n={9} seed={31 + (flip ? 50 : 0)} />}
				</g>
			))}
		</g>
	);
};

export const Plate: React.FC = () => {
	// venetian-blind light: slanted slats projected on the wall, cyan
	const slats = Array.from({length: 16}, (_, i) => i);
	return (
		<AbsoluteFill style={{background: '#04121a'}}>
			<svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
				<defs>
					<radialGradient id="wallBase" cx="50%" cy="40%" r="75%">
						<stop offset="0" stopColor="#0f4452" />
						<stop offset="0.45" stopColor="#0a2b36" />
						<stop offset="1" stopColor="#030d12" />
					</radialGradient>
					<linearGradient id="archIn" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#0d3a47" />
						<stop offset="0.6" stopColor="#0b2f3a" />
						<stop offset="1" stopColor="#06171e" />
					</linearGradient>
					<linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#0a1a20" />
						<stop offset="1" stopColor="#020507" />
					</linearGradient>
					<radialGradient id="flameGlow">
						<stop offset="0" stopColor="#FFB45A" stopOpacity="0.85" />
						<stop offset="0.35" stopColor="#FF8A3D" stopOpacity="0.25" />
						<stop offset="1" stopColor="#FF8A3D" stopOpacity="0" />
					</radialGradient>
					<radialGradient id="lampGlow">
						<stop offset="0" stopColor="#FFD08A" stopOpacity="0.7" />
						<stop offset="0.5" stopColor="#FFB060" stopOpacity="0.15" />
						<stop offset="1" stopColor="#FFB060" stopOpacity="0" />
					</radialGradient>
					<linearGradient id="wax" x1="0" x2="1">
						<stop offset="0" stopColor="#d9c7a8" />
						<stop offset="1" stopColor="#8f7c62" />
					</linearGradient>
					<radialGradient id="vase" cx="35%" cy="30%">
						<stop offset="0" stopColor="#6fb6c2" />
						<stop offset="1" stopColor="#0b2c34" />
					</radialGradient>
					<linearGradient id="art1" x1="0" y1="0" x2="1" y2="1">
						<stop offset="0" stopColor="#1b6b78" />
						<stop offset="0.5" stopColor="#c98a5a" />
						<stop offset="1" stopColor="#0e2d35" />
					</linearGradient>
					<linearGradient id="shelfShadow" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#000" stopOpacity="0.5" />
						<stop offset="1" stopColor="#000" stopOpacity="0" />
					</linearGradient>
					<linearGradient id="slat" x1="0" x2="1">
						<stop offset="0" stopColor="#3CCBFF" stopOpacity="0" />
						<stop offset="0.2" stopColor="#5fe0ff" stopOpacity="0.55" />
						<stop offset="0.8" stopColor="#3CCBFF" stopOpacity="0.4" />
						<stop offset="1" stopColor="#3CCBFF" stopOpacity="0" />
					</linearGradient>
					<linearGradient id="ceil" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#000" stopOpacity="0.6" />
						<stop offset="1" stopColor="#000" stopOpacity="0" />
					</linearGradient>
					<radialGradient id="haze" cx="50%" cy="35%" r="60%">
						<stop offset="0" stopColor="#3CCBFF" stopOpacity="0.22" />
						<stop offset="1" stopColor="#3CCBFF" stopOpacity="0" />
					</radialGradient>
					<clipPath id="archClip">
						<path d={`M240 ${HORIZON} L240 560 A300 300 0 0 1 840 560 L840 ${HORIZON} Z`} />
					</clipPath>
					<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6" /></filter>
					<filter id="soft2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2" /></filter>
					<filter id="noise"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4" /><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.6  0 0 0 0 0.65  0 0 0 0.10 0" /></filter>
					<pattern id="rugP" width="40" height="40" patternUnits="userSpaceOnUse">
						<rect width="40" height="40" fill="#1a2a2e" />
						<path d="M0 20 L20 0 L40 20 L20 40Z" fill="none" stroke="#2c4146" strokeWidth="3" />
					</pattern>
				</defs>

				{/* back wall */}
				<rect width={W} height={HORIZON} fill="url(#wallBase)" />
				{/* wall texture */}
				<rect width={W} height={HORIZON} filter="url(#noise)" />
				{/* ceiling falloff */}
				<rect width={W} height={420} fill="url(#ceil)" />

				{/* arched niche (curved wall) */}
				<path d={`M220 ${HORIZON} L220 560 A320 320 0 0 1 860 560 L860 ${HORIZON} Z`} fill="#06161c" />
				<path d={`M240 ${HORIZON} L240 560 A300 300 0 0 1 840 560 L840 ${HORIZON} Z`} fill="url(#archIn)" />
				{/* blind light inside the arch */}
				<g clipPath="url(#archClip)" filter="url(#soft2)">
					{slats.map((i) => (
						<path key={i} d={`M150 ${330 + i * 52} L930 ${250 + i * 52} L930 ${272 + i * 52} L150 ${352 + i * 52} Z`} fill="url(#slat)" opacity={0.9 - i * 0.035} />
					))}
				</g>
				{/* arch rim highlight */}
				<path d="M240 1180 L240 560 A300 300 0 0 1 840 560 L840 1180" fill="none" stroke="#3CCBFF" strokeOpacity={0.35} strokeWidth={3} filter="url(#soft2)" />
				{/* cyan LED cove along arch */}
				<path d="M228 1180 L228 560 A312 312 0 0 1 852 560 L852 1180" fill="none" stroke="#29D3FF" strokeWidth={10} strokeOpacity={0.25} filter="url(#soft)" />

				{/* framed art inside arch, top */}
				<rect x={455} y={400} width={170} height={120} fill="#0a1d23" stroke="#244650" strokeWidth={4} />
				<path d="M470 500 L520 440 L560 480 L585 455 L610 500Z" fill="#1c5f6a" opacity={0.9} />
				<circle cx={590} cy={430} r={12} fill="#FFB38A" opacity={0.8} />

				{/* shelves left and right */}
				<Shelf x={20} />
				<Shelf x={20} flip />

				{/* floor */}
				<rect y={HORIZON} width={W} height={H - HORIZON} fill="url(#floor)" />
				<rect y={HORIZON} width={W} height={H - HORIZON} filter="url(#noise)" opacity={0.8} />
				{/* baseboard */}
				<rect y={HORIZON - 14} width={W} height={14} fill="#07161b" />
				{/* rug, in perspective */}
				<path d={`M180 1300 L900 1300 L1080 1760 L0 1760Z`} fill="url(#rugP)" opacity={0.75} />
				<path d={`M180 1300 L900 1300 L1080 1760 L0 1760Z`} fill="#000" opacity={0.35} />
				{/* floor reflection of cove light */}
				<ellipse cx={540} cy={1260} rx={420} ry={40} fill="#29D3FF" opacity={0.12} filter="url(#soft)" />

				{/* atmosphere */}
				<rect width={W} height={H} fill="url(#haze)" />
			</svg>
		</AbsoluteFill>
	);
};
