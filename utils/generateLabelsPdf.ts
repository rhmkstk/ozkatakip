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
  const HEIGHT_MM = 50 // sadece QR olacak
  const QR_SIZE_MM = 50

  let doc: jsPDF | null = null

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    if (!doc) {
      doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [WIDTH_MM, HEIGHT_MM], // [width, height]
      })
    } else {
      doc.addPage([WIDTH_MM, HEIGHT_MM], "portrait")
    }

    // --- QR üretimi ---
    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-")
    const qr = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: 2,
      errorCorrectionLevel: "M",
      // scale: 8, // istersen açabilirsin (daha net PNG)
    })

    // QR: sayfayı tamamen doldur
    doc.addImage(qr, "PNG", 0, 0, QR_SIZE_MM, QR_SIZE_MM)
  }

  if (!doc) {
    throw new Error("No products to generate PDF.")
  }

  return URL.createObjectURL(doc.output("blob"))
}