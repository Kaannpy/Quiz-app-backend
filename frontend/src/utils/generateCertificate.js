import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const scoreColor = (rate) => {
  if (rate >= 75) return "#22c55e";
  if (rate >= 50) return "#eab308";
  return "#ef4444";
};

export async function generateCertificatePDF({
  userName,
  category,
  difficulty,
  date,
  successRate,
}) {
  const certId = `KQ-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const safeCategory = category || "Genel";
  const safeDifficulty = (difficulty || "Orta").toUpperCase();
  const safeDate =
    date ||
    new Date().toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const container = document.createElement("div");
  container.style.cssText =
    "position:fixed;left:-9999px;top:0;width:794px;height:1123px;background:#fff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;";

  container.innerHTML = `
    <div style="width:794px;height:1123px;padding:40px;box-sizing:border-box;position:relative;">
      <div style="position:absolute;inset:28px;border:3px solid #3b82f6;border-radius:4px;pointer-events:none;"></div>
      <div style="position:absolute;inset:36px;border:1px solid #cbd5e1;border-radius:4px;pointer-events:none;"></div>

      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-35deg);font-size:72px;font-weight:900;color:rgba(59,130,246,0.06);letter-spacing:8px;white-space:nowrap;pointer-events:none;">
        KAANQUIZ
      </div>

      <div style="text-align:center;padding-top:48px;position:relative;z-index:1;">
        <h1 style="margin:0;font-size:32px;font-weight:900;color:#1e3a8a;letter-spacing:1px;">
          BAŞARI SERTİFİKASI
        </h1>
        <p style="margin:12px 60px 0;font-size:13px;color:#64748b;line-height:1.6;">
          Bu belge, aşağıdaki adayın ilgili konudaki başarısını tasdik eder.
        </p>
      </div>

      <div style="text-align:center;margin-top:36px;position:relative;z-index:1;">
        <p style="margin:0;font-size:28px;font-weight:800;color:#0f172a;letter-spacing:2px;">
          ${escapeHtml((userName || "Aday").toUpperCase())}
        </p>
        <div style="width:280px;height:2px;background:#94a3b8;margin:10px auto 0;"></div>
      </div>

      <div style="margin:40px 48px 0;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px 28px;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:1;">
        <div style="flex:1;">
          <div style="display:flex;margin-bottom:14px;font-size:14px;">
            <span style="width:140px;color:#64748b;font-weight:600;">Sınav Konusu:</span>
            <span style="color:#0f172a;font-weight:700;">${escapeHtml(safeCategory.toUpperCase())}</span>
          </div>
          <div style="display:flex;margin-bottom:14px;font-size:14px;">
            <span style="width:140px;color:#64748b;font-weight:600;">Zorluk Seviyesi:</span>
            <span style="color:#0f172a;font-weight:700;">${escapeHtml(safeDifficulty)}</span>
          </div>
          <div style="display:flex;font-size:14px;">
            <span style="width:140px;color:#64748b;font-weight:600;">Sınav Tarihi:</span>
            <span style="color:#0f172a;font-weight:700;">${escapeHtml(safeDate)}</span>
          </div>
        </div>
        <div style="width:72px;height:72px;border-radius:50%;background:${scoreColor(successRate)};display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-left:24px;">
          <span style="color:#fff;font-size:22px;font-weight:900;">%${successRate}</span>
        </div>
      </div>

      <div style="position:absolute;bottom:80px;left:48px;right:48px;display:flex;justify-content:space-between;align-items:flex-end;z-index:1;">
        <div>
          <p style="margin:0;font-size:11px;color:#64748b;">Sertifika No: ${certId}</p>
          <p style="margin:4px 0 0;font-size:11px;color:#64748b;">Sistem Tarafından Üretilmiştir</p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0;font-size:14px;font-weight:700;color:#0f172a;">Kaan Nuri Pey</p>
          <div style="width:160px;height:1px;background:#94a3b8;margin:6px auto;"></div>
          <p style="margin:0;font-size:11px;color:#64748b;">Kurucu Eğitmen</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    doc.addImage(imgData, "PNG", 0, 0, 210, 297);
    doc.save(`KaanQuiz_Sertifika_${safeCategory.replace(/[^\w\s-]/g, "")}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
