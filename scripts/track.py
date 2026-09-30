# Estimate handheld camera motion from the original background (outside the matte) -> work/track.json
# Per frame: cumulative [dx, dy, rot_deg, scale] relative to frame 1, smoothed lightly.
import cv2, numpy as np, glob, json
src = sorted(glob.glob('work/src/*.png')); al = sorted(glob.glob('work/alpha/*.png'))
S = 0.5
def load(i):
    g = cv2.cvtColor(cv2.imread(src[i]), cv2.COLOR_BGR2GRAY); g = cv2.resize(g, None, fx=S, fy=S)
    a = cv2.resize(cv2.imread(al[i], 0), None, fx=S, fy=S)
    m = (cv2.dilate(a, np.ones((41, 41), np.uint8)) < 10).astype(np.uint8) * 255
    m[g > 245] = 0  # blown-out window has no texture
    return g, m
T = np.eye(3); out = [[0, 0, 0, 1]]
pg, pm = load(0)
for i in range(1, len(src)):
    g, m = load(i)
    p0 = cv2.goodFeaturesToTrack(pg, 400, 0.01, 8, mask=pm)
    M = None
    if p0 is not None and len(p0) > 12:
        p1, st, _ = cv2.calcOpticalFlowPyrLK(pg, g, p0, None, winSize=(21, 21), maxLevel=3)
        ok = st.ravel() == 1
        if ok.sum() > 10:
            M, _ = cv2.estimateAffinePartial2D(p0[ok], p1[ok], method=cv2.RANSAC, ransacReprojThreshold=2)
    if M is None: M = np.array([[1, 0, 0], [0, 1, 0]], float)
    T = np.vstack([M, [0, 0, 1]]) @ T
    s = np.sqrt(T[0, 0] ** 2 + T[1, 0] ** 2); r = np.degrees(np.arctan2(T[1, 0], T[0, 0]))
    out.append([T[0, 2] / S, T[1, 2] / S, r, s])
    pg, pm = g, m
a = np.array(out)
k = np.ones(5) / 5
sm = np.stack([np.convolve(np.pad(a[:, j], 2, mode='edge'), k, 'valid') for j in range(4)], 1)
json.dump([[round(float(v), 3) for v in r] for r in sm], open('work/track.json', 'w'))
print('frames', len(sm), 'range dx', sm[:, 0].min(), sm[:, 0].max(), 'dy', sm[:, 1].min(), sm[:, 1].max(), 'rot', sm[:, 2].min(), sm[:, 2].max(), 'scale', sm[:, 3].min(), sm[:, 3].max())
