import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { generateQrCodeUrl } from "./index";

function setPageSize(doc: jsPDF, width: number, height: number) {
  const pageSize = doc.internal.pageSize as {
    setWidth?: (value: number) => void;
    setHeight?: (value: number) => void;
    width?: number;
    height?: number;
  };

  if (pageSize.setWidth) {
    pageSize.setWidth(width);
  } else {
    pageSize.width = width;
  }

  if (pageSize.setHeight) {
    pageSize.setHeight(height);
  } else {
    pageSize.height = height;
  }
}

function getShortModelName(modelType: string | null | undefined) {
  if (!modelType) return "";

  const mappings: {
    [key in
      | "Karbondioksit gazli"
      | "Kuru Kimyevi Tozlu"
      | "Bioversal köpüklü"]: string;
  } = {
    "Karbondioksit gazli": "CO2",
    "Kuru Kimyevi Tozlu": "KKT",
    "Bioversal köpüklü": "BIO",
  };

  return mappings[modelType as keyof typeof mappings] || modelType;
}

export async function generateLabelsPdf(products) {
  // === TARGET: QR tam 5cm (50mm) genişlikte basılsın ===
  const WIDTH_MM = 50 // 5cm = 50mm
  const QR_SIZE_MM = WIDTH_MM // QR görselini sayfanın tamamına yay
  const GAP_MM = 4

  // Metinleri biraz daha okunur yapalım
  const FONT_PT = 9
  const LINE_H_MM = 4

  let doc: jsPDF | null = null

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    const lines = [
      `Model: ${[p.unit, getShortModelName(p.model_type)].filter(Boolean).join(" ") || "-"}`,
      `Seri No: ${p.serial_number || "-"}`,
      `Marka: ${p.brand || "-"}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || "-"}`,
    ]

    const textHeight = lines.length * LINE_H_MM
    const heightMM = QR_SIZE_MM + GAP_MM + textHeight

    if (!doc) {
      doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        // DİKKAT: jsPDF format = [width, height]
        format: [WIDTH_MM, heightMM],
      })
    } else {
      // DİKKAT: addPage format = [width, height]
      doc.addPage([WIDTH_MM, heightMM], "portrait")
    }

    // --- QR üretimi ---
    // quiet zone (beyaz çerçeve) için margin ekliyoruz
    // QR toplamda yine 50mm'e çizilecek.
    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-")
    const qr = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: 2, // 0 yerine 2: okunurluk için iyi
      errorCorrectionLevel: "M",
      // scale: 8, // istersen açabilirsin, PNG netliğini artırır
    })

    // QR: (0,0) noktasından başlayıp TAM 50mm'e bas
    doc.addImage(qr, "PNG", 0, 0, QR_SIZE_MM, QR_SIZE_MM)

    // --- Metin ---
    doc.setFont("helvetica", "bold")
    doc.setFontSize(FONT_PT)

    const centerX = WIDTH_MM / 2
    let y = QR_SIZE_MM + GAP_MM

    for (const ln of lines) {
      doc.text(ln, centerX, y, { align: "center", baseline: "top" })
      y += LINE_H_MM
    }
  }

  if (!doc) {
    throw new Error("No products to generate PDF.")
  }

  return URL.createObjectURL(doc.output("blob"))
}

type Product = any // sende zaten var

export async function generateBradyLabelPngUrls(products: Product[]) {
  // Brady M610 + 2.00" kartuş için mantıklı varsayım: 300 DPI
  const DPI = 300
  const INCH_WIDTH = 2.0
  const W = Math.round(INCH_WIDTH * DPI) // 600 px

  const GAP = 18 // px
  const FONT = 18 // px
  const LINE_H = 22 // px
  const TEXT_PAD_TOP = 8 // px
  const QR_MARGIN_MODULES = 2

  const urls: string[] = []

  for (const p of products) {
    const lines = [
      `Model: ${[p.unit, getShortModelName(p.model_type)].filter(Boolean).join(" ") || "-"}`,
      `Seri No: ${p.serial_number || "-"}`,
      `Marka: ${p.brand || "-"}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || "-"}`,
    ]

    // QR'ı yüksek çözünürlükte üret (600px)
    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-")
    const qrDataUrl = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: QR_MARGIN_MODULES,
      width: W,
      errorCorrectionLevel: "M",
    })

    // Yükseklik: QR + boşluk + metin
    const textHeight = lines.length * LINE_H + TEXT_PAD_TOP
    const H = W + GAP + textHeight

    const canvas = document.createElement("canvas")
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas context not available")

    // arka plan beyaz
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, W, H)

    // QR'ı çiz
    const img = await loadImage(qrDataUrl)
    ctx.drawImage(img, 0, 0, W, W)

    // Metin
    ctx.fillStyle = "#000"
    ctx.font = `bold ${FONT}px Arial`
    ctx.textAlign = "center"
    ctx.textBaseline = "top"

    let y = W + GAP + TEXT_PAD_TOP
    const cx = W / 2

    for (const ln of lines) {
      ctx.fillText(ln, cx, y)
      y += LINE_H
    }

    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png", 1)
    )

    urls.push(URL.createObjectURL(blob))
  }

  return urls
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = reject
    im.src = src
  })
}
