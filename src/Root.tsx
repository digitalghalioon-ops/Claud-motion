import React from 'react';
import {Composition} from 'remotion';
import content from './content.json';
import {Main} from './styles/A/Main';

const SIZES: Record<string, [number, number]> = {'9:16': [1080, 1920], '1:1': [1080, 1080], '16:9': [1920, 1080]};

export const RemotionRoot: React.FC = () => {
	const [width, height] = SIZES[content.format];
	return <Composition id="Main" component={Main} width={width} height={height} fps={content.fps} durationInFrames={content.durationInFrames} />;
};
