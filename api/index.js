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

let emptyCustomIds = {}

let gamesRunning = [
    {
        player0Taken: false,
        player1Taken: false,
        password: crypto.randomBytes(16).toString('hex'),
        gameId: 0,
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
    let gameId = null

    if(!gamesRunning[gamesRunning.length - 1].player0Taken || !gamesRunning[gamesRunning.length - 1].player1Taken){
        gameId = gamesRunning.length - 1
        if(gamesRunning[gameId].player0Taken == false){
            currPlayer = 0
            gamesRunning[gameId].player0Taken = true
        }else{
            currPlayer = 1
            gamesRunning[gameId].player1Taken = true
        }
        
        password = gamesRunning[gameId].password
        state = gamesRunning[gameId].state
    }else if(gamesRunning[gamesRunning.length - 1].player0Taken && gamesRunning[gamesRunning.length - 1].player1Taken){
        currPlayer = 0
        gameId = gamesRunning.length

        password = crypto.randomBytes(16).toString('hex')
        let gameObj = {
            player0Taken: true,
            player1Taken: false,
            password,
            gmaeId: gamesRunning.length,
            state: null
        }
        
        gamesRunning.push(gameObj)
    }

    console.log(`Player ${currPlayer + 1} connected`)
    res.json({"text": `connected as player ${currPlayer + 1}`, playerId: currPlayer, password, state, gameId})
})

app.post("/connect", (req, res) => {
    if(req.body.id == undefined){
        res.statusCode = 400;
        res.json({"text": "didn't sent id of game"})
        return
    }

    let customId = req.body.id
    let currPlayer = null;
    let password = null
    let state = null
    let gameId = null

    if(!Object.keys(emptyCustomIds).includes(customId) || emptyCustomIds[customId] == undefined){
        gameId = gamesRunning.length
        currPlayer = 0
        password = crypto.randomBytes(16).toString('hex')
        let gameObj = {
            player0Taken: true,
            player1Taken: false,
            password,
            gameId,
            state: null
        }
        
        let newId = gamesRunning.push(gameObj)
        newId--
        emptyCustomIds[customId] = newId
    }else if(Object.keys(emptyCustomIds).includes(customId) && !gamesRunning[gamesRunning.length - 1].player1Taken){
        currPlayer = 1
        
        gameId = emptyCustomIds[customId]
        gamesRunning[gameId].player1Taken = true
        password = gamesRunning[gameId].password
        state = gamesRunning[gameId].state

        emptyCustomIds[customId] = undefined
    }else if(Object.keys(obj).includes(customId) && gamesRunning[gamesRunning.length - 1].player0Taken && gamesRunning[gamesRunning.length - 1].player1Taken){
        res.statusCode = 400;
        res.json({"text": "game is already full"})
        return
    }

    console.log(`Player ${currPlayer + 1} connected to game ${customId}`)
    res.json({"text": `connected as player ${currPlayer + 1}`, playerId: currPlayer, password, state, gameId})
})

app.post("/moveMade", (req, res) => {
    if(req.body != undefined){
        const body = req.body

        events.emit("moveMade", body)
        gamesRunning[0].state = body
        res.json({text: "game state updated"})
    }else{
        res.statusCode = 504
        res.json({text: "body of the request is undefined"})
    }
})

app.get("/waitUntilMoveMade", (req, res) => {
    let responseSent = false

    let sendGameState = (state) => {
        if(state.password == gamesRunning[0].password){
            gamesRunning[state.gameId].state = state

            let arePlayersAlive = true
            state.playerData.forEach((player) => {
                if(player.hp <= 0){
                    arePlayersAlive = false
                    state.winner = `${Number(state.playerData[0].hp < state.playerData[1].hp)}`
                }
            })

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