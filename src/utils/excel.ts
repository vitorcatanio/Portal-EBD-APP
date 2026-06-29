import * as XLSX from "xlsx";

/**
 * Exports any JSON array to an Excel (.xlsx) file.
 * @param data Array of objects to export
 * @param fileName Name of the output file (without extension)
 * @param sheetName Name of the sheet inside Excel
 */
export const exportToExcel = (data: any[], fileName: string, sheetName: string = "Portal EBD") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Reads an Excel (.xlsx) file and returns its rows as a JSON array.
 * Supports columns like "Nome", "Data de nascimento", "Telefone", "Turma".
 * @param file Excel file from an input tag
 */
export const readExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
