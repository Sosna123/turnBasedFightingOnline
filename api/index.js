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

let gamesRunning = [
    {
        player0Taken: false,
        player1Taken: false,
        password: null,
        state: null
    }
]

// favicon.ico fix
app.get("/favicon.ico", (req, res) => {
    res.send("")
})

// connect to game
app.get("/connect", (req, res) => {
    let currPlayer = null;
    let password = null
    let state = null

    if(gamesRunning[gamesRunning.length - 1].player0Taken == false){
        currPlayer = 0
        password = crypto.randomBytes(16).toString('hex')
        let gameObj = {
            player0Taken: true,
            player1Taken: false,
            password,
            state: null
        }
        
        gamesRunning[gamesRunning.length - 1] = gameObj
    }else if(gamesRunning[gamesRunning.length - 1].player0Taken && !gamesRunning[gamesRunning.length - 1].player1Taken){
        currPlayer = 1
        
        gamesRunning[gamesRunning.length - 1].player1Taken = true
        password = gamesRunning[gamesRunning.length - 1].password
        state = gamesRunning[gamesRunning.length - 1].state
    }else if(gamesRunning[gamesRunning.length - 1].player0Taken && gamesRunning[gamesRunning.length - 1].player1Taken){
        // res.statusCode = 400;
        // res.json({"text": "game is already full"})
        // return

        currPlayer = 0
        password = crypto.randomBytes(16).toString('hex')
        let gameObj = {
            player0Taken: true,
            player1Taken: false,
            password,
            state: null
        }
        
        gamesRunning.push(gameObj)
    }

    console.log(gamesRunning)

    console.log(`Player ${currPlayer + 1} connected`)
    res.json({"text": `connected as player ${currPlayer + 1}`, playerId: currPlayer, password, state})
})

app.post("/moveMade", (req, res) => {
    if(req.body != undefined){
        const body = req.body

        events.emit("moveMade", body)
        gamesRunning[0].state = body
        res.json({text: "game state updated"})
    }else{
        res.statusCode = 400
        res.json({text: "body of the request is undefined"})
    }
})

app.get("/waitUntilMoveMade", (req, res) => {
    let responseSent = false

    let sendGameState = (state) => {
        gamesRunning[0].state = state

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