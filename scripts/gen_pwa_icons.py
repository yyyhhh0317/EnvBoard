"""生成 EnvBoard PWA 图标：512/192 PNG（emerald 渐变 + .env 文本）"""
import os
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

FONT_BOLD = 'C:/Windows/Fonts/segoeui.ttf'
FONT_MONO = 'C:/Windows/Fonts/consola.ttf'


def lerp(a, b, t):
    return a + (b - a) * t


def make_icon(size: int) -> Image.Image:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 对角渐变背景（#10b981 -> #047857）
    top = (16, 185, 129)
    bottom = (4, 120, 87)
    for y in range(size):
        t = y / size
        color = tuple(int(lerp(top[i], bottom[i], t)) for i in range(3))
        draw.line([(0, y), (size, y)], fill=color + (255,))

    # 中央圆角白卡
    card_w = int(size * 0.74)
    card_h = int(size * 0.46)
    card_x0 = (size - card_w) // 2
    card_y0 = (size - card_h) // 2
    radius = int(size * 0.08)
    card = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cdraw = ImageDraw.Draw(card)
    cdraw.rounded_rectangle(
        [card_x0, card_y0, card_x0 + card_w, card_y0 + card_h],
        radius=radius,
        fill=(255, 255, 255, 235),
    )
    img = Image.alpha_composite(img, card)

    draw = ImageDraw.Draw(img)
    # 中央大字体：ENV（加粗 sans-serif），品牌名
    main_font = ImageFont.truetype(FONT_BOLD, int(size * 0.22))

    val_color = (255, 255, 255, 245)  # 白色，最显眼

    # 居中：ENV
    text = 'ENV'
    tb = draw.textbbox((0, 0), text, font=main_font)
    text_w = tb[2] - tb[0]
    text_h = tb[3] - tb[1]
    cx = (size - text_w) // 2 - tb[0]
    cy = (size - text_h) // 2 - tb[1]
    draw.text((cx, cy), text, font=main_font, fill=val_color)

    return img


for s in (512, 192):
    icon = make_icon(s)
    icon.save(os.path.join(OUT_DIR, f'icon-{s}.png'))
    print(f'generated icon-{s}.png ({icon.size[0]}x{icon.size[1]})')