const { google } = require("googleapis");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const {
      name, nickname, email, company,
      area, lineId, instagram,
      seeking, offering, hobbies, goals,
      source, referrer, photoUrl,
    } = data;

    if (!name || !nickname || !email || !company || !referrer) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "必須項目が不足しています" }),
      };
    }

    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const timestamp = new Date().toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
    });

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Sheet1!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          timestamp,
          name,
          nickname,
          email,
          company,
          area      || "",
          lineId    || "",
          instagram || "",
          seeking   || "",
          offering  || "",
          hobbies   || "",
          goals     || "",
          source    || "",
          referrer,
          photoUrl  || "",
          "当日現金払い",
        ]],
      },
    });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "登録に失敗しました: " + err.message }),
    };
  }
};
