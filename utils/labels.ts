import QRCode from "qrcode"
import { jsPDF } from "jspdf"

function getShortModelName(modelType: string | null | undefined) {
  if (!modelType) return ""

  const mappings: { [key in "Karbondioksit gazli" | "Kuru Kimyevi Tozlu" | "Bioversal köpüklü"]: string } = {
    "Karbondioksit gazli": "CO2",
    "Kuru Kimyevi Tozlu": "KKT",
    "Bioversal köpüklü": "BIO",
  }

  return mappings[modelType as keyof typeof mappings] || modelType
}

export async function generateLabelsPdf(products) {
  const PADDING = 1
  const QR = 12
  const GAP = 3
  const WIDTH = 50
  const FONT = 6
  const LINE_H = 3

  let doc = null

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    const lines = [
      `Model: ${[p.unit, getShortModelName(p.model_type)].filter(Boolean).join(" ") || "-"}`,
      `Seri No: ${p.serial_number || "-"}`,
      `Marka: ${p.brand || "-"}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || "-"}`
    ]

    const textHeight = lines.length * LINE_H
    const contentHeight = Math.max(QR, textHeight)
    const height = contentHeight + PADDING * 2 // gerçek yükseklik (mm)

    // ✅ SAYFAYI LANDSCAPE oluştur → 50mm genişlik GERÇEKTEN genişlik olur
    if (!doc) {
      doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [height, WIDTH]     // height = kısa kenar, WIDTH = uzun kenar
      })
    } else {
      doc.addPage([height, WIDTH], "landscape")
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(FONT)

    const startX = PADDING
    const startY = PADDING

    // ✅ QR PNG (sorunsuz)
    const qr = await QRCode.toDataURL(String(p.locations?.location_id ?? "-"), {
      type: "image/png",
      margin: 0
    })
    doc.addImage(qr, "PNG", startX, startY, QR, QR)

    // ✅ METİN
    const textX = startX + QR + GAP
    let y = startY                  // tam üst padding'den başla
    
    for (const ln of lines) {
      doc.text(ln, textX, y, {
        align: "left",
        baseline: "top",            // ⬅️ kritik: üstten hizala
      })
      y += LINE_H
    }
  }

  return URL.createObjectURL(doc.output("blob"))
}
