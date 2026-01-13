import PDFDocument from "pdfkit";
import dayjs from "dayjs";
export async function renderInvoicePdf(data) {
    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on("data", (d) => chunks.push(d));
    const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));
    doc.fontSize(20).text("TelcoCredit PNG", { align: "left" });
    doc.moveDown(0.5);
    doc.fontSize(14).text("Invoice / Statement", { align: "left" });
    doc.moveDown();
    doc.fontSize(10).text(`Invoice No: ${data.invoiceNo}`);
    doc.text(`Company: ${data.companyName}`);
    doc.text(`Billing Email: ${data.billingEmail}`);
    doc.text(`Period: ${dayjs(data.periodStart).format("YYYY-MM-DD")} to ${dayjs(data.periodEnd).format("YYYY-MM-DD")}`);
    doc.text(`Issue Date: ${dayjs(data.issueDate).format("YYYY-MM-DD")}`);
    doc.text(`Due Date: ${dayjs(data.dueDate).format("YYYY-MM-DD")}`);
    doc.moveDown();
    doc.fontSize(12).text("Charges", { underline: true });
    doc.moveDown(0.3);
    data.lines.forEach((l) => {
        doc.fontSize(10).text(`${l.description}`, { continued: true });
        doc.text(`  PGK ${l.amount.toFixed(2)}`, { align: "right" });
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total Due: PGK ${data.total.toFixed(2)}`, { align: "right" });
    doc.moveDown();
    doc.fontSize(10).text("Payment Instructions", { underline: true });
    doc.fontSize(9).text(data.paymentInstructions);
    doc.end();
    return done;
}
