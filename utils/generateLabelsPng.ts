import QRCode from "qrcode";
// import { jsPDF } from "jspdf";
import { generateQrCodeUrl } from "./index";

// function setPageSize(doc: jsPDF, width: number, height: number) {
//   const pageSize = doc.internal.pageSize as {
//     setWidth?: (value: number) => void;
//     setHeight?: (value: number) => void;
//     width?: number;
//     height?: number;
//   };

//   if (pageSize.setWidth) {
//     pageSize.setWidth(width);
//   } else {
//     pageSize.width = width;
//   }

//   if (pageSize.setHeight) {
//     pageSize.setHeight(height);
//   } else {
//     pageSize.height = height;
//   }
// }

// function getShortModelName(modelType: string | null | undefined) {
//   if (!modelType) return "";

//   const mappings: {
//     [key in
//       | "Karbondioksit gazli"
//       | "Kuru Kimyevi Tozlu"
//       | "Bioversal köpüklü"]: string;
//   } = {
//     "Karbondioksit gazli": "CO2",
//     "Kuru Kimyevi Tozlu": "KKT",
//     "Bioversal köpüklü": "BIO",
//   };

//   return mappings[modelType as keyof typeof mappings] || modelType;
// }

export async function generateLabelsPng(products) {
  const MM_TO_PX = 300 / 25.4 // 300 DPI (etiket yazıcılar için ideal)
  const SIZE_MM = 50
  const SIZE_PX = Math.round(SIZE_MM * MM_TO_PX)

  const blobs: string[] = []

  for (let i = 0; i < products.length; i++) {
    const p = products[i]

    const canvas = document.createElement("canvas")
    canvas.width = SIZE_PX
    canvas.height = SIZE_PX

    const ctx = canvas.getContext("2d")
    if (!ctx) continue

    // Beyaz zemin
    ctx.fillStyle = "#fff"
    ctx.fillRect(0, 0, SIZE_PX, SIZE_PX)

    // QR üretimi (AYNI)
    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-")
    const qr = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: 2,
      errorCorrectionLevel: "M",
    })

    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = qr
    })

    ctx.drawImage(img, 0, 0, SIZE_PX, SIZE_PX)

    const blob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b!), "image/png")
    )

    blobs.push(URL.createObjectURL(blob))
  }

  return blobs // her ürün için 1 PNG URL
}
