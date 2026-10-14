const express = require("express")
const cors = require("cors")
const EventEmiter = require("events")
const morgan = require("morgan")
const crypto = require("crypto")

const events = new EventEmiter()

const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan("dev"))

app.set('etag', false)

const port = 3000
const maxTimeWaiting = 15 * 1000

let gamesRunning = []

// favicon.ico fix
app.get("/favicon.ico", (req, res) => {
    res.send("")
})

// connect to game
app.get("/connect", (req, res) => {
    let currPlayer = null;
    let password = null

    if(gamesRunning[0] == undefined){
        currPlayer = 0
        password = crypto.randomBytes(16).toString('hex')
        let gameObj = {
            player0Taken: true,
            player1Taken: false,
            password
        }
        
        gamesRunning[0] = gameObj
    }else if(gamesRunning[0].player0Taken && !gamesRunning[0].player1Taken){
        currPlayer = 1
        
        gamesRunning[0].player1Taken = true
        password = gamesRunning[0].password
    }else if(gamesRunning[0].player0Taken && gamesRunning[0].player1Taken){
        res.statusCode = 400;
        res.json({"text": "game is already full"})
        return
    }

    console.log(`Player ${currPlayer + 1} connected`)
    res.json({"text": `connected as player ${currPlayer + 1}`, playerId: currPlayer, password})
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
        let arePlayersAlive = true
        state.playerData.forEach((player) => {
            if(player.hp <= 0){
                arePlayersAlive = false
                state.winner = `${Number(state.playerData[0].hp < state.playerData[1].hp)}`
            }
        })

        if(state.password == gamesRunning[0].password){
            res.json({text: "A move was made", state})
            responseSent = true
        }
    }

    events.once("moveMade", sendGameState)

    setTimeout(() => {
        if(!responseSent){
            events.removeListener("moveMade", sendGameState)
            res.statusCode = 504
            res.json({text: `No move was made in ${maxTimeWaiting}ms`})
        }
    }, maxTimeWaiting)  
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})