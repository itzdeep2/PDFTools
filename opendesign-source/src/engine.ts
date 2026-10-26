import {
  Canvas,
  IText,
  Rect,
  Circle,
  Triangle,
  Line,
  Polygon,
  FabricImage,
  ActiveSelection,
  Gradient,
  filters,
  FabricObject
} from 'fabric'
import { jsPDF } from 'jspdf'
import { useStore, Sel } from './store'

export type DropPayload =
  | { type: 'text'; kind: 'heading' | 'subheading' | 'body' }
  | { type: 'shape'; kind: 'rect' | 'rounded' | 'circle' | 'triangle' | 'line' | 'star' }
  | { type: 'image'; id: string }
  | { type: 'bg'; value: string | [string, string] }

export const FONTS = [
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Tahoma',
  'Impact',
  'Comic Sans MS'
]

let canvas: Canvas | null = null
let stack: string[] = []
let pos = -1
let busy = false
let clip: FabricObject | null = null
let timer: ReturnType<typeof setTimeout> | null = null

const sync = () => useStore.getState().set({ canUndo: pos > 0, canRedo: pos < stack.length - 1 })

const snap = () => {
  if (!canvas || busy) return
  const json = JSON.stringify(canvas.toJSON())
  if (json === stack[pos]) return
  stack = stack.slice(0, pos + 1)
  stack.push(json)
  if (stack.length > 60) stack.shift()
  pos = stack.length - 1
  sync()
}

const later = () => {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    snap()
  }, 350)
}

const flush = () => {
  if (timer) {
    clearTimeout(timer)
    timer = null
    snap()
  }
}

const readSel = (): Sel | null => {
  const o = canvas?.getActiveObject()
  if (!o) return null
  const base = {
    opacity: o.opacity ?? 1,
    fontFamily: 'Arial',
    fontSize: 40,
    fill: '#000000',
    textAlign: 'left',
    bold: false,
    italic: false,
    brightness: 0,
    blur: 0,
    grayscale: false
  }
  if (o instanceof ActiveSelection) return { ...base, kind: 'multi' }
  if (o instanceof IText) {
    return {
      ...base,
      kind: 'text',
      fontFamily: String(o.fontFamily),
      fontSize: Math.round(o.fontSize),
      fill: typeof o.fill === 'string' ? o.fill : '#000000',
      textAlign: String(o.textAlign),
      bold: o.fontWeight === 'bold' || Number(o.fontWeight) >= 700,
      italic: o.fontStyle === 'italic'
    }
  }
  if (o instanceof FabricImage) {
    const list = (o.filters || []) as any[]
    const b = list.find((f) => f instanceof filters.Brightness)
    const bl = list.find((f) => f instanceof filters.Blur)
    return {
      ...base,
      kind: 'image',
      brightness: b ? b.brightness : 0,
      blur: bl ? bl.blur : 0,
      grayscale: list.some((f) => f instanceof filters.Grayscale)
    }
  }
  const paint = o instanceof Line ? o.stroke : o.fill
  return { ...base, kind: 'shape', fill: typeof paint === 'string' ? paint : '#6366f1' }
}

const emit = () => {
  const o = canvas?.getActiveObject()
  if (o instanceof IText) o.setControlsVisibility({ ml: false, mr: false, mt: false, mb: false })
  useStore.getState().set({ sel: readSel() })
}

export const init = (el: HTMLCanvasElement, w: number, h: number) => {
  canvas = new Canvas(el, {
    width: w,
    height: h,
    backgroundColor: '#ffffff',
    preserveObjectStacking: true,
    selection: true
  })
  stack = []
  pos = -1
  snap()
  canvas.on('selection:created', emit)
  canvas.on('selection:updated', emit)
  canvas.on('selection:cleared', emit)
  canvas.on('object:modified', (e) => {
    const t = e.target
    if (t instanceof IText) {
      t.set({ fontSize: Math.round(t.fontSize * (t.scaleY || 1)), scaleX: 1, scaleY: 1 })
      t.setCoords()
    }
    snap()
    emit()
  })
  canvas.on('text:editing:exited', () => {
    snap()
    emit()
  })
  return () => {
    const c = canvas
    canvas = null
    c?.dispose()
  }
}

const center = () => ({ x: (canvas?.width ?? 0) / 2, y: (canvas?.height ?? 0) / 2 })

const place = (o: FabricObject, x?: number, y?: number) => {
  if (!canvas) return
  const c = center()
  o.set({ left: x ?? c.x, top: y ?? c.y, originX: 'center', originY: 'center' })
  canvas.add(o)
  canvas.setActiveObject(o)
  canvas.requestRenderAll()
  snap()
  emit()
}

export const addText = (kind: 'heading' | 'subheading' | 'body', x?: number, y?: number) => {
  const cfg = {
    heading: { t: 'Add a heading', s: 96, w: 'bold' },
    subheading: { t: 'Add a subheading', s: 56, w: 'bold' },
    body: { t: 'Add a little bit of body text', s: 36, w: 'normal' }
  }[kind]
  place(
    new IText(cfg.t, {
      fontFamily: 'Arial',
      fontSize: cfg.s,
      fontWeight: cfg.w,
      fill: '#111827',
      textAlign: 'center'
    }),
    x,
    y
  )
}

const starPoints = () => {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 100 : 42
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r })
  }
  return pts
}

export const addShape = (
  kind: 'rect' | 'rounded' | 'circle' | 'triangle' | 'line' | 'star',
  x?: number,
  y?: number
) => {
  const fill = '#6366f1'
  const shapes: Record<string, () => FabricObject> = {
    rect: () => new Rect({ width: 300, height: 300, fill }),
    rounded: () => new Rect({ width: 360, height: 240, rx: 40, ry: 40, fill }),
    circle: () => new Circle({ radius: 150, fill }),
    triangle: () => new Triangle({ width: 300, height: 260, fill }),
    line: () => new Line([0, 0, 360, 0], { stroke: '#111827', strokeWidth: 8, strokeLineCap: 'round' }),
    star: () => new Polygon(starPoints(), { fill, scaleX: 2, scaleY: 2 })
  }
  place(shapes[kind](), x, y)
}

export const addImage = async (src: string, x?: number, y?: number) => {
  if (!canvas) return
  const img = await FabricImage.fromURL(src)
  const s = Math.min(1, (canvas.width * 0.6) / img.width, (canvas.height * 0.6) / img.height)
  img.scale(s)
  place(img, x, y)
}

export const setBg = (v: string | [string, string]) => {
  if (!canvas) return
  canvas.backgroundColor =
    typeof v === 'string'
      ? v
      : new Gradient({
          type: 'linear',
          gradientUnits: 'pixels',
          coords: { x1: 0, y1: 0, x2: canvas.width, y2: canvas.height },
          colorStops: [
            { offset: 0, color: v[0] },
            { offset: 1, color: v[1] }
          ]
        })
  canvas.requestRenderAll()
  snap()
}

export const handleDrop = (p: DropPayload, x: number, y: number) => {
  if (p.type === 'text') addText(p.kind, x, y)
  else if (p.type === 'shape') addShape(p.kind, x, y)
  else if (p.type === 'bg') setBg(p.value)
  else if (p.type === 'image') {
    const u = useStore.getState().uploads.find((i) => i.id === p.id)
    if (u) addImage(u.src, x, y)
  }
}

export const setPage = (w: number, h: number) => {
  if (!canvas) return
  canvas.setDimensions({ width: w, height: h })
  const b = canvas.backgroundColor
  if (b instanceof Gradient) b.coords = { ...b.coords, x2: w, y2: h }
  canvas.requestRenderAll()
  useStore.getState().set({ pageW: w, pageH: h })
}

export const setProp = (p: Partial<Sel>) => {
  const o = canvas?.getActiveObject()
  if (!canvas || !o) return
  const multi = o instanceof ActiveSelection
  if (p.opacity !== undefined) {
    const targets = multi ? o.getObjects() : [o]
    targets.forEach((t) => t.set('opacity', p.opacity as number))
  }
  if (!multi) {
    if (o instanceof IText) {
      if (p.fontFamily !== undefined) o.set('fontFamily', p.fontFamily)
      if (p.fontSize !== undefined) o.set('fontSize', Math.max(4, p.fontSize))
      if (p.fill !== undefined) o.set('fill', p.fill)
      if (p.textAlign !== undefined) o.set('textAlign', p.textAlign)
      if (p.bold !== undefined) o.set('fontWeight', p.bold ? 'bold' : 'normal')
      if (p.italic !== undefined) o.set('fontStyle', p.italic ? 'italic' : 'normal')
    } else if (o instanceof FabricImage) {
      const cur = readSel()
      if (cur) {
        const b = p.brightness ?? cur.brightness
        const bl = p.blur ?? cur.blur
        const g = p.grayscale ?? cur.grayscale
        const list: any[] = []
        if (b !== 0) list.push(new filters.Brightness({ brightness: b }))
        if (bl > 0) list.push(new filters.Blur({ blur: bl }))
        if (g) list.push(new filters.Grayscale())
        o.filters = list
        o.applyFilters()
      }
    } else if (p.fill !== undefined) {
      o.set(o instanceof Line ? 'stroke' : 'fill', p.fill)
    }
  }
  o.setCoords()
  canvas.requestRenderAll()
  useStore.getState().set({ sel: readSel() })
  later()
}

export const layer = (a: 'forward' | 'backward' | 'front' | 'back') => {
  const o = canvas?.getActiveObject()
  if (!canvas || !o || o instanceof ActiveSelection) return
  if (a === 'forward') canvas.bringObjectForward(o)
  if (a === 'backward') canvas.sendObjectBackwards(o)
  if (a === 'front') canvas.bringObjectToFront(o)
  if (a === 'back') canvas.sendObjectToBack(o)
  canvas.requestRenderAll()
  snap()
}

export const remove = () => {
  if (!canvas) return
  const list = canvas.getActiveObjects()
  if (!list.length) return
  canvas.discardActiveObject()
  list.forEach((o) => canvas!.remove(o))
  canvas.requestRenderAll()
  snap()
  emit()
}

export const copy = async () => {
  const o = canvas?.getActiveObject()
  if (o) clip = await o.clone()
}

export const paste = async () => {
  if (!canvas || !clip) return
  const c = await clip.clone()
  canvas.discardActiveObject()
  c.set({ left: (c.left ?? 0) + 24, top: (c.top ?? 0) + 24, evented: true })
  if (c instanceof ActiveSelection) {
    ;(c as any).canvas = canvas
    c.forEachObject((o) => canvas!.add(o))
    c.setCoords()
  } else {
    canvas.add(c)
  }
  clip.set({ left: c.left, top: c.top })
  canvas.setActiveObject(c)
  canvas.requestRenderAll()
  snap()
  emit()
}

const restore = async (i: number) => {
  if (!canvas || i < 0 || i >= stack.length) return
  busy = true
  pos = i
  await canvas.loadFromJSON(JSON.parse(stack[i]))
  canvas.discardActiveObject()
  canvas.requestRenderAll()
  busy = false
  sync()
  useStore.getState().set({ sel: null })
}

export const undo = () => {
  flush()
  return restore(pos - 1)
}

export const redo = () => {
  flush()
  return restore(pos + 1)
}

export const isEditingText = () => {
  const o = canvas?.getActiveObject()
  return o instanceof IText && !!o.isEditing
}

const download = (url: string, name: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export const exportAs = (fmt: 'png' | 'jpg' | 'pdf') => {
  if (!canvas) return
  flush()
  canvas.discardActiveObject()
  canvas.renderAll()
  const w = canvas.width
  const h = canvas.height
  const png = canvas.toDataURL({ format: 'png', multiplier: 2, enableRetinaScaling: false })
  if (fmt === 'png') return download(png, 'opendesign.png')
  if (fmt === 'jpg') {
    const jpg = canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 2, enableRetinaScaling: false })
    return download(jpg, 'opendesign.jpg')
  }
  const page = canvas.toDataURL({ format: 'jpeg', quality: 0.95, multiplier: 2, enableRetinaScaling: false })
  const pdf = new jsPDF({
    orientation: w >= h ? 'landscape' : 'portrait',
    unit: 'px',
    format: [w, h],
    hotfixes: ['px_scaling'],
    compress: true
  })
  pdf.addImage(page, 'JPEG', 0, 0, w, h)
  pdf.save('opendesign.pdf')
}

export const readFileAsImage = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('read failed'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('decode failed'))
      img.onload = () => {
        const max = 1800
        const s = Math.min(1, max / Math.max(img.width, img.height))
        const c = document.createElement('canvas')
        c.width = Math.round(img.width * s)
        c.height = Math.round(img.height * s)
        c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
        resolve(c.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.92))
      }
      img.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })

export const addFiles = async (files: FileList | File[], x?: number, y?: number) => {
  for (const f of Array.from(files)) {
    if (!f.type.startsWith('image/')) continue
    try {
      const src = await readFileAsImage(f)
      useStore.getState().addUpload({ id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, src, name: f.name })
      if (x !== undefined) await addImage(src, x, y)
    } catch {
      continue
    }
  }
}