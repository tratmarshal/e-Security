// ========== search.gs ==========
// คำสั่งค้นหาหมายจับ

function searchWarrant(searchType, keyword) {
  if (searchType !== "id13" && searchType !== "name") {
    throw new Error("ประเภทการค้นหาไม่ถูกต้อง");
  }

  const term = normalizeText_(keyword);
  if (!term) return { success: true, data: [] };

  const results = [];
  getWarrantSheets_().forEach(sheet => {
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) return;
    const columns = getWarrantColumnMap_(values[0]);

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      const rowId13 = normalizeText_(row[columns.id13]);
      const rowName = normalizeText_(row[columns.fullName]);
      const match = searchType === "id13"
        ? rowId13 === term
        : rowName.toLowerCase().indexOf(term.toLowerCase()) !== -1;

      if (match) {
        results.push({
          sheetName: sheet.getName(),
          rowNumber: r + 1,
          warrantNo: normalizeText_(row[columns.warrantNo]),
          fullName: rowName,
          id13: rowId13,
          bail: normalizeText_(row[columns.bail]),
          submitTo: normalizeText_(row[columns.submitTo]),
          status: normalizeText_(row[columns.status]) || WARRANT_STATUS_WANTED,
          charge: normalizeText_(row[columns.charge]),
          blackCaseNo: normalizeText_(row[columns.blackCaseNo]),
          redCaseNo: normalizeText_(row[columns.redCaseNo])
        });
      }
    }
  });

  return { success: true, data: results };
}

