import {continueRender, delayRender, staticFile} from 'remotion';

const AR = 'U+0600-06FF, U+0750-077F, U+08A0-08FF, U+FB50-FDFF, U+FE70-FEFF, U+200C-200E';
const faces: [string, string, string, string?][] = [
	['Tajawal', 'fonts/tajawal-arabic-900-normal.woff2', '900', AR],
	['Tajawal', 'fonts/tajawal-latin-900-normal.woff2', '900', 'U+0000-00FF, U+2000-206F, U+00D7'],
	['Orbitron', 'fonts/orbitron-latin-900-normal.woff2', '900'],
	['Inter', 'fonts/inter-latin-800-normal.woff2', '800'],
];

let started = false;
export const loadFonts = () => {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('fonts');
	Promise.all(
		faces.map(([family, file, weight, range]) => {
			const f = new FontFace(family, `url(${staticFile(file)}) format('woff2')`, {
				weight,
				...(range ? {unicodeRange: range} : {}),
			});
			return f.load().then((l) => document.fonts.add(l));
		}),
	)
		.then(() => continueRender(handle))
		.catch((e) => {
			console.error(e);
			continueRender(handle);
		});
};

export const AR_FONT = "'Tajawal', 'Almarai', 'Cairo', sans-serif";
export const WORDMARK_FONT = "'Orbitron', 'Michroma', sans-serif";
export const UI_FONT = "'Inter', sans-serif";
