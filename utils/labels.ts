// /utils/labels.client.ts   ⬅️ client-only kalsın
import QRCode from 'qrcode'
import { jsPDF } from 'jspdf'
import 'svg2pdf.js' // ⬅️ default export YOK; side-effect import

type ProductWithLocation = {
  id: string
  unit: string | null
  model_type: string | null
  serial_number: string | null
  brand: string | null
  manufacture_year: string | null
  locations: { location_id: string | number | null } | null
}

const LABEL_WIDTH_MM = 50
const LABEL_MIN_HEIGHT_MM = 35
const PADDING_MM = 3
const QR_SIZE_MM = 24
const GAP_MM = 3

function computeLabelHeight(lines: string[], lineHeight = 4) {
  const textHeight = lines.length * lineHeight + 1
  const contentHeight = Math.max(QR_SIZE_MM, textHeight)
  return Math.max(LABEL_MIN_HEIGHT_MM, PADDING_MM * 2 + contentHeight)
}

export async function generateLabelsPdf(products: ProductWithLocation[]) {
  let doc: jsPDF | null = null

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const locationId = String(p.locations?.location_id ?? '')

    // 1) SVG QR üret
    const qrSvg = await QRCode.toString(locationId, {
      type: 'svg',
      errorCorrectionLevel: 'Q',
      margin: 0
    })

    // 2) Metin satırları
    const lines = [
      `Model/Tip: ${[p.unit, p.model_type].filter(Boolean).join(' ') || '-'}`,
      `Seri No: ${p.serial_number || '-'}`,
      `Marka: ${p.brand || '-'}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || '-'}`,
      `Lokasyon: ${locationId || '-'}`
    ]

    const labelHeight = computeLabelHeight(lines)

    if (i === 0) {
      doc = new jsPDF({
        unit: 'mm',
        format: [LABEL_WIDTH_MM, labelHeight],
        compress: true
      })
    } else {
      doc!.addPage([LABEL_WIDTH_MM, labelHeight])
    }

    const startX = PADDING_MM
    const startY = PADDING_MM

    // 3) QR yerleştir — doc.svg ile
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(qrSvg, 'image/svg+xml').documentElement

    // width/height ver; ölçekleme derdi yok
    await (doc as any)!.svg(svgDoc as unknown as SVGElement, {
      x: startX,
      y: startY,
      width: QR_SIZE_MM,
      height: QR_SIZE_MM
    })

    // 4) Metin bloğu
    const textX = startX + QR_SIZE_MM + GAP_MM
    const textYStart = startY + 2
    const lineHeight = 4

    doc!.setFontSize(9)
    lines.forEach((line, idx) => {
      doc!.text(line, textX, textYStart + idx * lineHeight, {
        align: 'left',
        baseline: 'top'
      })
    })
  }

  const blob = doc!.output('blob')
  const url = URL.createObjectURL(blob)
  return url
}
