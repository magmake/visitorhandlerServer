const express = require("express");
const app = express();
const port = 443;
const multer = require("multer");
const upload = multer();
const path = require("path");
const fs = require("fs");
const https = require("https");
require('dotenv').config();

//avaimet tiedostonhakuun ja -siirtoon
const apiKey = process.env.SSL_KEY_FILE;
const apiCert = process.env.SSL_CRT_FILE;

const getUniqueFileId = (dirPath) => {
  let fileCount = 0;

  // Käy läpi kaikki tiedostot ja kansiot
  const walkSync = (dir) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Käy läpi alikansiot rekursiivisesti
        walkSync(filePath);
      } else if (path.extname(file) === ".json" && dir.indexOf('uploads') !== -1) {
        // Lisää vain tiedostot, joiden polku sisältää "uploads" -kansion
        fileCount++;
      }
    });
  };

  walkSync(dirPath);
  return fileCount;
};
try {
  (privateKey = fs.readFileSync(apiKey, "utf8")),
    (certificate = fs.readFileSync(apiCert, "utf8"));
} catch (err) {
  console.error("Virhe tiedoston lukemisessa: ", err);
  process.exit(1);
}

// Luodaan HTTPS-palvelin, joka käyttää luotua avainparia ja sertifikaattia
const options = {
  key: fs.readFileSync(apiKey, "utf8"),
  cert: fs.readFileSync(apiCert, "utf8"),
};

const palvelin = https.createServer(options, app);

app.use(express.json());

app.use((req, res, next) => {
    //määritellään ip-osoite, josta lomake voidaan lähettää
  const allowedIps = ["https://172.17.166.55:3000", "https://localhost:3000"];
  const requestIp = req.headers.origin;

  if (allowedIps.includes(requestIp)) {
    res.setHeader("Access-Control-Allow-Origin", requestIp);
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  next();
});

app.get("/data", (req, res) => {
  const directoryPath = path.join(__dirname, "uploads");
  let data = [];

  const getFiles = (dirPath) => {
    fs.readdirSync(dirPath).forEach((file) => {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        getFiles(filePath);
      } else {
        if (path.extname(filePath) === ".json") {
          const fileData = fs.readFileSync(filePath, "utf8");
          const parsedData = JSON.parse(fileData);
          data.push(parsedData);
          console.log("palvelin", parsedData);
        }
      }
    });
  };

  getFiles(directoryPath);

  res.json(data);
});

app.post("/", upload.single("tiedot"), (req, res) => {
  const tiedostonNimi = req.body.jsonNimi;
  const tiedot = req.body.tiedot;
  const date = JSON.parse(tiedot).date;
  const time = JSON.parse(tiedot).time;

  console.log(`PALVELIN Tiedoston nimi: ${tiedostonNimi}`);
  console.log(`PALVELIN Tiedot: ${tiedot}`);
  console.log("Date", date);

  //tarkista, että tiedoston nimi löytyy
  if (tiedostonNimi != undefined) {
    console.log(`PALVELIN Tiedoston nimi: ${tiedostonNimi}`);
    console.log(`PALVELIN Tiedot: ${tiedot}`);
    let nimi = tiedostonNimi;
    let i = 1;
    // jos kansio päivämäärälle ei löydy, tehdään uusi
    if (!fs.existsSync(`./uploads/${date}`)) {
      fs.mkdirSync(`./uploads/${date}`);
    }
    // jos saman niminen tiedosto löytyy, lisätään perään numero
    while (fs.existsSync(`./uploads/${date}/${nimi}.json`)) {
      nimi = `${tiedostonNimi}-${i}`;
      i++;
    }
    const uniqueId = getUniqueFileId(`./uploads`);
    // tehdään tiedosto
    const fileData = JSON.parse(tiedot);
    fileData.uniqueId = uniqueId;
    const updatedData = JSON.stringify(fileData);
    fs.writeFile(
      `./uploads/${date}/[${time}]_${nimi}.json`,
      updatedData,
      (err) => {
        if (err) {
          console.log(err);
          return res.status(500).send(err);
        }
        console.log("Tiedosto tallennettu");
        console.log(updatedData);
        return res.status(200).send("Tiedosto tallennettu");
      }
    );

    // Tallenna tiedosto projektiin
  } else {
    console.log("PALVELIN Tiedosto puuttuu");
  }
});

palvelin.listen(port, () => {
  console.log(`Example app listening at https://localhost:${port}`);
});
