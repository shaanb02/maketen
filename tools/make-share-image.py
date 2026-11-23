# Draws img/share.png, the 1200x630 picture that shows in link previews.
# Run from the maketen-web folder: python3 tools/make-share-image.py
# Needs Pillow (pip install pillow) and the macOS system fonts. It is only run
# by hand when the picture should change; the page itself never needs it.
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
NAVY, INK, YELLOW, MUTED = (11, 21, 48), (241, 245, 255), (250, 204, 21), (169, 184, 226)
BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

def font(size):
    return ImageFont.truetype(BOLD, size)

img = Image.new("RGB", (W, H), NAVY)
d = ImageDraw.Draw(img)
icon = Image.open("../MakeTen/MakeTen/Assets.xcassets/AppIcon.appiconset/AppIcon.png").convert("RGBA").resize((120, 120))
mask = Image.new("L", (120, 120), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, 119, 119), radius=28, fill=255)
img.paste(icon, (80, 70), mask)
d.text((230, 78), "Make Ten", font=font(76), fill=INK)
d.text((232, 162), "A free daily math puzzle", font=font(34), fill=MUTED)

# Four sample tiles (not a real day's digits, so the picture never goes stale).
for i, digit in enumerate("????"):
    x = 80 + i * 190
    d.rounded_rectangle((x, 268, x + 160, 428), radius=28, fill=INK)
    d.rounded_rectangle((x, 420, x + 160, 436), radius=8, fill=YELLOW)
    d.text((x + 80, 348), digit, font=font(110), fill=NAVY, anchor="mm")
d.text((880, 300), "= 10", font=font(96), fill=YELLOW)
d.text((80, 500), "Use all four digits with + − × ÷ to make 10.", font=font(40), fill=INK)
d.text((80, 556), "How many ways can you find?", font=font(36), fill=MUTED)
img.save("img/share.png", optimize=True)
print("saved img/share.png")
