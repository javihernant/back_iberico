import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import cors from 'cors';

dotenv.config();
const app = express();

app.use(cors({
  origin: process.env.FRONT_ORIGIN,
}));

const numEquipos = 12

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(
    Buffer.from(process.env.SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8')
  ),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

async function getSheetRange(range) {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: "v4", auth: client });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SPREADSHEET_ID,
      range,
    });
    return response.data.values;
}

app.get("/api/equipos", async (req, res) => {
  try {
    const data = await getSheetRange("Resultados!C7:C18");
    const retjson = data.flat()
    res.json(retjson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/recibidos_dados", async (req, res) => {
    try {
      const data = await getSheetRange("Resultados!C7:K19");
      const table = data.slice(0, numEquipos).map((row)=>{
        return [row[0],row[1],row[2], row[3], row[5],row[8]]
      })
      const glb_row = data[numEquipos]
      const retjson = {table, glb:{puntualidad:glb_row[5],comentarios:glb_row[7]}}
      res.json(retjson);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get("/api/recibidos", async (req, res) => {
    try {
      const data = await getSheetRange("Resultados!M7:R19");
      const table = data.slice(0,numEquipos)
      const retjson = {table, glb:data[numEquipos][5]}
      res.json(retjson);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get("/api/dados", async (req, res) => {
    try {
      const data = await getSheetRange("Resultados!T7:Y19");
      const table = data.slice(0,numEquipos)
      const retjson = {table, glb:data[numEquipos][5]}
      res.json(retjson);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get("/api/resultados", async (req, res) => {
    try {
      const data = await getSheetRange("Resultados!AB7:AD18");
      const ret = data.map(row=>{
        return {
          equipo: row[0],
          puntuacion: Number(row[1].replace(',','.')),
          ranking: row[2]
        }
      })
      .sort((a,b) => b.puntuacion - a.puntuacion)

      res.json(ret);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.get("/api/respuestas_faltan", async (req, res) => {
    try {
      const data = await getSheetRange("Resultados!Y2:AB3");
      const info_respuestas = {recibidos:data[0][0], total:data[0][1], num_faltan:data[1][1], porc_faltan:data[1][2]}
      res.json(info_respuestas);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
});

app.listen(3001, () => console.log("Server running on port 3001"));
