"""Shared native-pixel palette/contour production for approved rigs and skins."""
from PIL import Image

INK = (42, 28, 23)
LIT_INK = (58, 38, 29)


def linear(value):
    value /= 255
    return value / 12.92 if value <= .04045 else ((value + .055) / 1.055) ** 2.4


def srgb(value):
    value = value * 12.92 if value <= .0031308 else 1.055 * value ** (1 / 2.4) - .055
    return max(0, min(255, round(value * 255)))


class PixelFinish:
    def __init__(self, palette):
        self.colors = sorted({tuple(srgb(linear(v) * shade) for v in bytes.fromhex(c.lstrip('#')))
                              for c in palette for shade in (.68, .84, 1, 1.08)} | {INK, LIT_INK})
        self.cache = {}

    def closest(self, color):
        if color not in self.cache:
            self.cache[color] = min(self.colors, key=lambda candidate: sum(
                (a-b)**2 for a, b in zip(candidate, color)))
        return self.cache[color]

    def finish(self, path):
        source = Image.open(path).convert('RGBA')
        alpha = source.getchannel('A').point(lambda a: 255 if a >= 128 else 0)
        mask = alpha.load()
        contour = Image.new('L', source.size)
        pixels = contour.load()
        for y in range(source.height):
            for x in range(source.width):
                pixels[x,y] = max(mask[nx,ny]
                    for ny in range(max(0,y-1),min(source.height,y+2))
                    for nx in range(max(0,x-1),min(source.width,x+2)))
        result = Image.new('RGBA', source.size, (*INK,0))
        result.putalpha(contour)
        target, original = result.load(), source.load()
        for y in range(source.height):
            for x in range(source.width):
                if mask[x,y]:
                    target[x,y] = (*self.closest(original[x,y][:3]),255)
                elif pixels[x,y] and ((x+1 < source.width and mask[x+1,y]) or
                                      (y+1 < source.height and mask[x,y+1])):
                    target[x,y] = (*LIT_INK,255)
        return result
