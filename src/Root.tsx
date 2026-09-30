import React from 'react';
import {Composition} from 'remotion';
import content from './content.json';
import {Main} from './styles/A/Main';
import {Plate} from './reel/Plate';
import {REEL_FRAMES, Reel} from './reel/Reel';

const SIZES: Record<string, [number, number]> = {'9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080]};

export const RemotionRoot: React.FC = () => {
	const [width, height] = SIZES[content.format];
	return (
		<>
			<Composition id="Main" component={Main} width={width} height={height} fps={content.fps} durationInFrames={content.durationInFrames} />
			<Composition id="Reel" component={Reel} width={1080} height={1920} fps={30} durationInFrames={REEL_FRAMES} />
			<Composition id="Plate" component={Plate} width={2160} height={3840} fps={30} durationInFrames={1} />
		</>
	);
};
