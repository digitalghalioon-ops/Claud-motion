import React from 'react';
import {interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {AR_FONT} from './fonts';
import {CLAMP, EASE_OUT, pop} from './easing';
import {C, TEXT_SHADOW, TEXT_SHADOW_RED} from '../styles/A/tokens';

export type Word = {text: string; at: number};

const TRAIL = /([؟!…]+)$/;

// One word = one unit. Arabic is never split per letter (joining).
const WordUnit: React.FC<{w: Word; variant: 'word' | 'line'; onRed?: boolean; color: string}> = ({
	w,
	variant,
	onRed,
	color,
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	const m = w.text.match(TRAIL);
	const body = m ? w.text.slice(0, -m[1].length) : w.text;
	const punct = m ? m[1] : '';
	const dur = variant === 'line' ? 6 : 7;
	const p = interpolate(frame, [w.at, w.at + dur], [0, 1], {...CLAMP, easing: EASE_OUT});
	const op = interpolate(frame, [w.at, w.at + 3], [0, 1], CLAMP);
	const blur = variant === 'line' ? 18 * (1 - p) : 14 * (1 - p);
	const scale = variant === 'line' ? 1.08 - 0.08 * p : 1.06 - 0.06 * p;
	const x = variant === 'line' ? 0 : -24 * (1 - p);
	const pAt = w.at + 3;
	const ps = pop(frame, fps, pAt);
	const pOp = interpolate(frame, [pAt, pAt + 3], [0, 1], CLAMP);
	const hasQ = punct.includes('؟');
	return (
		<span style={{display: 'inline-flex', alignItems: 'baseline', direction: 'rtl'}}>
			<span
				style={{
					display: 'inline-block',
					opacity: op,
					filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
					transform: `translateX(${x}px) scale(${scale})`,
					color,
					textShadow: onRed ? TEXT_SHADOW_RED : TEXT_SHADOW,
				}}
			>
				{body}
			</span>
			{punct ? (
				<span
					style={{
						display: 'inline-block',
						opacity: pOp,
						transform: `translateY(${hasQ ? 0.35 : 0}em) scale(${Math.max(0, ps)})`,
						transformOrigin: '50% 70%',
						color,
						textShadow: onRed ? TEXT_SHADOW_RED : TEXT_SHADOW,
					}}
				>
					{punct}
				</span>
			) : null}
		</span>
	);
};

export const KineticLine: React.FC<{
	words: Word[];
	y: number; // px, vertical center
	size: number;
	color?: string;
	onRed?: boolean;
	variant?: 'word' | 'line';
	x?: number; // px right edge; centered when omitted
	style?: React.CSSProperties;
}> = ({words, y, size, color = C.ink, onRed, variant = 'word', x, style}) => {
	return (
		<div
			style={{
				position: 'absolute',
				top: y,
				left: 0,
				right: x !== undefined ? 1080 - x : 0,
				transform: 'translateY(-50%)',
				display: 'flex',
				justifyContent: x !== undefined ? 'flex-start' : 'center',
				direction: 'rtl',
				gap: size * 0.26,
				fontFamily: AR_FONT,
				fontWeight: 900,
				fontSize: size,
				lineHeight: 1.25,
				whiteSpace: 'nowrap',
				...style,
			}}
		>
			{words.map((w, i) => (
				<WordUnit key={i} w={w} variant={variant} onRed={onRed} color={color} />
			))}
		</div>
	);
};
