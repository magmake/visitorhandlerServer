const express = require("express");
const app = express();
const port = 3000;
const multer = require("multer");
const upload = multer();
const fs = require("fs");

app.use(express.json());

app.post("/", upload.single("tiedot"), (req, res) => {
  const tiedostonNimi = req.body.jsonNimi;
  const tiedot = req.body.tiedot;

  console.log(`PALVELIN Tiedoston nimi: ${tiedostonNimi}`);
  console.log(`PALVELIN Tiedot: ${tiedot}`);

  if (tiedostonNimi != undefined) {
    console.log(`PALVELIN Tiedoston nimi: ${tiedostonNimi}`);
    console.log(`PALVELIN Tiedot: ${tiedot}`);
    let nimi = tiedostonNimi;
    let i = 1;
    while (fs.existsSync(`./uploads/${nimi}.json`)) {
      nimi = `${tiedostonNimi}-${i}`;
      i++;
    }
    fs.writeFile(`./uploads/${nimi}.json`, tiedot, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).send(err);
      }
      console.log("Tiedosto tallennettu");
      return res.status(200).send("Tiedosto tallennettu");
    });

    // Tallenna tiedosto projektiin
  } else {
    console.log("PALVELIN Tiedosto puuttuu");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
