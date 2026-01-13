import ExcelJS from "exceljs";
import dayjs from "dayjs";
export async function renderUsageXlsx(rows) {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Usage");
    ws.columns = [
        { header: "Employee", key: "employeeName", width: 24 },
        { header: "MSISDN", key: "msisdn", width: 16 },
        { header: "Department", key: "department", width: 18 },
        { header: "Network", key: "network", width: 10 },
        { header: "Amount (PGK)", key: "amount", width: 12 },
        { header: "Status", key: "status", width: 10 },
        { header: "Date/Time", key: "createdAt", width: 20 },
        { header: "Telco Ref", key: "telcoRef", width: 18 }
    ];
    rows.forEach(r => {
        ws.addRow({
            ...r,
            createdAt: dayjs(r.createdAt).format("YYYY-MM-DD HH:mm:ss")
        });
    });
    ws.getRow(1).font = { bold: true };
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
