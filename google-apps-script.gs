/**
 * @OnlyCurrentDoc
 */

// ------------------------------------
//  Google Apps Script (Server-side)
// ------------------------------------

// POST 요청을 처리하여 데이터를 시트에 기록합니다.
function doPost(e) {
  try {
    // !!! 중요: 이 ID를 자신의 구글 시트 ID로 변경하세요.
    // 시트 URL에서 확인할 수 있습니다: https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
    const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

    // 헤더가 없으면 생성
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Type", "Date", "Content", "Mood", "Reaction"]);
    }

    const data = JSON.parse(e.postData.contents);

    // 새 행에 데이터 추가
    sheet.appendRow([
      new Date(),
      data.type,
      data.date,
      data.content,
      data.mood,
      data.reaction
    ]);

    // 성공 응답 반환
    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Data saved successfully." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 에러 응답 반환
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET 요청을 처리하여 시트의 모든 데이터를 JSON으로 반환합니다.
function doGet(e) {
  try {
    // !!! 중요: 이 ID를 자신의 구글 시트 ID로 변경하세요.
    const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheets()[0];

    if (sheet.getLastRow() < 2) {
        return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    // 헤더를 제외한 모든 데이터 가져오기 (A2부터)
    const range = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn());
    const values = range.getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const data = values.map(row => {
        let obj = {};
        headers.forEach((header, index) => {
            obj[header] = row[index];
        });
        return obj;
    });

    // JSON 형태로 데이터 반환
    return ContentService
      .createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
