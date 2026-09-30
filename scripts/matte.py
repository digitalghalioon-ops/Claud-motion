# RobustVideoMatting (ONNX, CPU) -> work/alpha/%05d.png, then refine -> work/fg/%05d.png (RGBA)
import onnxruntime as ort, numpy as np, cv2, glob, os
W = 'work'
os.makedirs(f'{W}/alpha', exist_ok=True); os.makedirs(f'{W}/fg', exist_ok=True)
sess = ort.InferenceSession(f'{W}/rvm_resnet50_fp32.onnx', providers=['CPUExecutionProvider'])
files = sorted(glob.glob(f'{W}/src/*.png'))
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
ds = np.array([0.25], np.float32)
for i, f in enumerate(files):
    img = cv2.cvtColor(cv2.imread(f), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
    src = img.transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {'src': src, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': ds})
    cv2.imwrite(f'{W}/alpha/{i+1:05d}.png', (pha[0, 0] * 255).clip(0, 255).astype(np.uint8))
    if i % 50 == 0: print(i, flush=True)
# refine: temporal median(3), erode 1px, feather 2px
al = sorted(glob.glob(f'{W}/alpha/*.png'))
A = [cv2.imread(a, 0) for a in al]
k = np.ones((3, 3), np.uint8)
for i, f in enumerate(files):
    m = np.median(np.stack([A[max(i-1, 0)], A[i], A[min(i+1, len(A)-1)]]), 0).astype(np.uint8)
    m = cv2.erode(m, k, 1)
    m = cv2.GaussianBlur(m, (0, 0), 1.0)
    img = cv2.imread(f)
    cv2.imwrite(f'{W}/fg/{i+1:05d}.png', np.dstack([img, m]))
print('done')
