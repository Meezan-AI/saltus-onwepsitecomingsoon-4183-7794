/**
 * Renders the quotation article to a real multi-page A4 PDF and downloads it.
 * Works on phones, where the print dialog is clumsy. The libraries load on demand so they never weigh on other pages.
 * Page breaks snap to the bottom of a table row or section so lines are not cut in half.
 */
export async function downloadQuotePdf(el: HTMLElement, filename: string): Promise<void> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);

  const SCALE = 2;
  const breaks: number[] = [];
  const canvas = await html2canvas(el, {
    scale: SCALE,
    useCORS: true,
    backgroundColor: "#ffffff",
    // Lay the document out at desktop width even on a phone, so the table (not the mobile cards) is captured.
    windowWidth: 1100,
    onclone: (_doc, clone) => {
      clone.style.width = "794px";
      clone.style.maxWidth = "794px";
      clone.style.margin = "0";
      clone.style.boxShadow = "none";
      const top = clone.getBoundingClientRect().top;
      clone.querySelectorAll<HTMLElement>(".qt-avoid, tbody tr, header").forEach((n) => {
        // Never break right after a group heading row — it would be left alone at the bottom of a page.
        if (n.tagName === "TR" && n.querySelector("td[colspan]")) return;
        breaks.push((n.getBoundingClientRect().bottom - top) * SCALE);
      });
    },
  });

  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const MARGIN = 10;
  const pageW = 210 - MARGIN * 2;
  const pageH = 297 - MARGIN * 2;
  const slicePx = Math.floor((canvas.width * pageH) / pageW);
  const candidates = breaks.filter((b) => b > 0).sort((a, b) => a - b);

  let pos = 0;
  let first = true;
  while (pos < canvas.height - 2) {
    const limit = pos + slicePx;
    let end = canvas.height;
    if (limit < canvas.height) {
      const fit = candidates.filter((c) => c > pos + slicePx * 0.4 && c <= limit);
      end = fit.length ? Math.floor(fit[fit.length - 1]) : limit;
    }
    const part = document.createElement("canvas");
    part.width = canvas.width;
    part.height = end - pos;
    const ctx = part.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, part.width, part.height);
    ctx.drawImage(canvas, 0, pos, canvas.width, end - pos, 0, 0, canvas.width, end - pos);
    if (!first) pdf.addPage();
    pdf.addImage(part.toDataURL("image/jpeg", 0.95), "JPEG", MARGIN, MARGIN, pageW, (part.height * pageW) / part.width);
    first = false;
    pos = end;
  }
  pdf.save(filename);
}
