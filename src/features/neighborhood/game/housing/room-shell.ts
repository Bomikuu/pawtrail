/** Structural timber/plaster backing; existing native wall tiles provide the detail. */
export function roomShellRects(width:number,height:number,wallpaper:string,doorColumn:number|null=12) {
  const w=width*32,h=height*32,doorX=doorColumn===null?w:(doorColumn-1)*32,doorW=doorColumn===null?0:64
  const plaster:Record<string,number>={cream:0xf2dec0,sage:0xc5ceb2,beige:0xe2c8a7,blue:0xb8c9c8,wood:0xd4aa74,wallpaper:0xe8d2b4}
  return [
    [0x4d3425,0,0,w,64], [plaster[wallpaper]||plaster.cream,8,12,w-16,48],
    [0x9c653c,4,4,w-8,8], [0xe2b674,8,4,w-16,2],
    [0x5c3c29,0,0,16,h], [0x5c3c29,w-16,0,16,h],
    [0xb37a46,4,8,9,h-16], [0xb37a46,w-13,8,9,h-16],
    [0xe2b674,4,8,2,h-16], [0xe2b674,w-13,8,2,h-16],
    [0x5c3c29,0,h-12,doorX,12], [0x5c3c29,doorX+doorW,h-12,w-doorX-doorW,12],
    [0xd9a866,8,h-12,Math.max(0,doorX-8),3], [0xd9a866,doorX+doorW,h-12,Math.max(0,w-doorX-doorW-8),3],
  ] as [number,number,number,number,number][]
}
