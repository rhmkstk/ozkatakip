import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { generateQrCodeUrl } from "./index";

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
  const PADDING = 1;
  const QR = 4;
  const GAP = 3;
  const WIDTH = 50;
  const FONT = 6;
  const LINE_H = 3;

  let doc = null;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];

    const lines = [
      `Model: ${[p.unit, getShortModelName(p.model_type)]
        .filter(Boolean)
        .join(" ") || "-"}`,
      `Seri No: ${p.serial_number || "-"}`,
      `Marka: ${p.brand || "-"}`,
      `Üretim: ${p.manufacture_year?.slice(0, 4) || "-"}`,
    ];

    const textHeight = lines.length * LINE_H;
    const contentHeight = QR + GAP + textHeight;
    const height = contentHeight + PADDING * 2;

    if (!doc) {
      doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [height, WIDTH],
      });
    } else {
      doc.addPage([height, WIDTH], "landscape");
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(FONT);

    const startY = PADDING;
    const centerX = WIDTH / 2;

    const qrData = generateQrCodeUrl(p.locations?.location_id ?? "-");
    const qr = await QRCode.toDataURL(qrData, {
      type: "image/png",
      margin: 0,
    });
    const qrX = centerX - QR / 2;
    doc.addImage(qr, "PNG", qrX, startY, QR, QR);

    let y = startY + QR + GAP;

    for (const ln of lines) {
      doc.text(ln, centerX, y, {
        align: "center",
        baseline: "top",
      });
      y += LINE_H;
    }
  }

  return URL.createObjectURL(doc.output("blob"));
}
