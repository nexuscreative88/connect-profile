const { google } = require("googleapis");

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // パスワード認証
  const password = event.queryStringParameters?.password;
  const correctPassword = process.env.PROFILES_PASSWORD || "connect2024";

  if (password !== correctPassword) {
    return {
      statusCode: 401,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "パスワードが正しくありません" }),
    };
  }

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_CLIENT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!A2:I",
    });

    const rows = response.data.values || [];

    const profiles = rows.map((row) => ({
      timestamp: row[0] || "",
      name: row[1] || "",
      company: row[2] || "",
      role: row[3] || "",
      email: row[4] || "",
      phone: row[5] || "",
      sns: row[6] || "",
      bio: row[7] || "",
      photoUrl: row[8] || "",
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profiles }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "データ取得に失敗しました: " + err.message }),
    };
  }
};
