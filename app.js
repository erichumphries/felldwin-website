const http = require('http')
const express = require('express')
const app = express()
const path = require("path")
const fsPromises = require("fs/promises")

const port = 3000;

const startApp = async () => {
    app.use(express.static( path.join(__dirname, 'views') ))
    app.use(express.static( path.join(__dirname, "/public") ))

    app.get('/', function(req, res) {
        res.send("index.html")
    })

    app.get('/countries.json', async function (req, res) {
        const countriesFile = await fsPromises.readFile('data/countries.json');
        res.json(JSON.parse(countriesFile))
    })

    app.get('/gods.json', async function (req, res) {
        const godsFile = await fsPromises.readFile('data/gods.json');
        res.json(JSON.parse(godsFile))
    })

    app.get('/table.json', async function (req, res) {
        const tableFile = await fsPromises.readFile('data/table.json');
        res.json(JSON.parse(tableFile))
    })
}

startApp()
app.listen( port, () => console.log(`listening on... ${port}`) )