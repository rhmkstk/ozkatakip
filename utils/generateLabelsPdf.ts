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
  const WIDTH = 50;      // mm -> 5cm
  const PADDING = 0;     // QR tam 5cm olsun istiyorsan 0 öneririm
  const GAP = 3;

  const FONT = 6;
  const LINE_H = 3;

  // QR'ı sayfa genişliği kadar bas (padding varsa düş)
  const QR = WIDTH - PADDING * 2;

  let doc: jsPDF | null = null;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    const lines = [
      `Model: ${[p.unit, getShortModelName(p.model_type)].filter(Boolean).join(" ") || "-"}`,
      `Seri No: ${p.serial_number || "-"}`,
      `Marka: ${p.brand || "-"}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || "-"}`,
    ];

    const textHeight = lines.length * LINE_H;
    const contentHeight = QR + GAP + textHeight;
    const height = contentHeight + PADDING * 2;

    if (!doc) {
      doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        // DİKKAT: format [width, height] olmalı
        format: [WIDTH, height],
      });
    } else {
      // DİKKAT: addPage de [width, height]
      doc.addPage([WIDTH, height], "portrait");
    }

    // setPageSize kullanıyorsan da width,height olarak ver
    setPageSize(doc, WIDTH, height);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT);

    const startY = PADDING;
    const startX = PADDING;

    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-");
    const qr = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: 0,
      // istersen daha net basım için:
      // errorCorrectionLevel: "M",
      // scale: 8,
    });

    // QR: sol üstten başlayıp tam genişlikte bas
    doc.addImage(qr, "PNG", startX, startY, QR, QR);

    let y = startY + QR + GAP;
    const centerX = WIDTH / 2;

    for (const ln of lines) {
      doc.text(ln, centerX, y, {
        align: "center",
        baseline: "top",
      });
      y += LINE_H;
    }
  }

  if (!doc) {
    throw new Error("No products to generate PDF.");
  }

  return URL.createObjectURL(doc.output("blob"));
}
