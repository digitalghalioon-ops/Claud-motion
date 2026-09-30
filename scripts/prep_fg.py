# Realism pass baked into the subject: seat cleanup, color match to plate ambient, cyan rim, light wrap.
# work/fg/%05d.png (RGBA) + public/plate.png -> public/fg/%05d.png (RGBA, straight alpha)
import cv2, numpy as np, glob, os
from concurrent.futures import ProcessPoolExecutor
os.makedirs('public/fg', exist_ok=True)
plate = cv2.resize(cv2.imread('public/plate.png'), (1080, 1920), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
plate_blur = cv2.GaussianBlur(plate, (0, 0), 20)
AMB = np.array([0x30, 0x22, 0x0B], np.float32) / 255  # #0B2230 in BGR
RIM = np.array([0xFF, 0xCB, 0x3C], np.float32) / 255  # #3CCBFF in BGR
H, W = 1920, 1080
yy, xx = np.mgrid[0:H, 0:W]
seat_zone = (xx > W * 0.74) & (yy > H * 0.52)

def work(f):
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    bgr = im[..., :3].astype(np.float32) / 255; a = im[..., 3].astype(np.float32) / 255
    # seat/headrest cleanup: dark, low-saturation pixels in the bottom-right zone aren't skin or the white shirt
    hsv = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2HSV)
    seat = seat_zone & (hsv[..., 2] < 120) & (hsv[..., 1] < 90)
    seat = cv2.dilate(seat.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool) & seat_zone
    a[seat] = 0
    # keep largest blob only
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0.5).astype(np.uint8))
    if n > 2:
        big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
        keep = cv2.dilate((lab == big).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(np.float32)
        a *= cv2.GaussianBlur(keep, (0, 0), 1.5)
    # color match: pull exposure down, cool white balance, shift shadows toward ambient
    c = bgr * 0.8
    c[..., 2] *= 0.9; c[..., 1] *= 0.97; c[..., 0] *= 1.06
    lum = (0.114 * c[..., 0] + 0.587 * c[..., 1] + 0.299 * c[..., 2])[..., None]
    c = c + (1 - lum) ** 2 * (AMB - c) * 0.6
    # soft highlight rolloff so sunlit shirt doesn't clip against the dark room
    c = 1 - np.exp(-c * 1.8) / 1.0
    c = c / (1 - np.exp(-1.8))
    # rim light: matte - eroded matte, blur 6px, cyan, screen 35%
    er = cv2.erode(a, np.ones((9, 9), np.uint8))
    rim = cv2.GaussianBlur(np.clip(a - er, 0, 1), (0, 0), 6)[..., None]
    c = 1 - (1 - c) * (1 - RIM * rim * 0.35 * 2.2)
    # light wrap: blurred plate x edge mask, add 15%
    edge = cv2.GaussianBlur(np.clip(a - cv2.erode(a, np.ones((31, 31), np.uint8)), 0, 1), (0, 0), 10)[..., None]
    c = c + plate_blur * edge * 0.15 * 3
    out = np.dstack([np.clip(c, 0, 1) * 255, a * 255]).astype(np.uint8)
    cv2.imwrite('public/fg/' + os.path.basename(f), out, [cv2.IMWRITE_PNG_COMPRESSION, 3])

files = sorted(glob.glob('work/fg/*.png'))
with ProcessPoolExecutor(4) as ex: list(ex.map(work, files, chunksize=8))
print('done', len(files))
