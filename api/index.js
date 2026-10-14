const express = require("express")
const cors = require("cors")
const EventEmiter = require("events")

const events = new EventEmiter()

const app = express()
app.use(cors())
app.use(express.json())

const port = 3000
const maxTimeWaiting = 30 * 1000

let gamesRunning = []

// connect to game
app.get("/connect", (req, res) => {
    let currPlayer = null;

    if(gamesRunning[0] == undefined){
        currPlayer = 0
        let gameObj = {
            player0Taken: true,
            player1Taken: false
        }
        
        gamesRunning[0] = gameObj
    }else if(gamesRunning[0].player0Taken && !gamesRunning[0].player1Taken){
        currPlayer = 1
        let gameObj = {
            player0Taken: true,
            player1Taken: true
        }
        
        gamesRunning[0] = gameObj
    }else if(gamesRunning[0].player0Taken && gamesRunning[0].player1Taken){
        res.statusCode = 400;
        res.json({"text": "game is already full"})
        return
    }

    console.log(`Player ${currPlayer + 1} connected`)
    res.json({"text": `connected as player ${currPlayer + 1}`, playerId: currPlayer})
})

app.post("/moveMade", (req, res) => {
    if(req.body != undefined){
        const body = req.body

        res.json({text: "game state updated"})
        events.emit("moveMade", body)
    }else{
        res.statusCode = 400
        res.json({text: "body of the request is undefined"})
    }
})

app.get("/waitUntilMoveMade", (req, res) => {
    let responseSent = false

    let sendGameState = (state) => {
        res.json({text: "A move was made", state})
        responseSent = true
    }

    events.once("moveMade", sendGameState)

    setTimeout(() => {
        if(!responseSent){
            events.removeListener("moveMade", sendGameState)
            res.statusCode = 204
            res.json({text: `No move was made in ${maxTimeWaiting}ms`})
        }
    }, maxTimeWaiting)  
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})