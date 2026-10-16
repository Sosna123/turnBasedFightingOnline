class Player{
    constructor(startId){
        this.id = startId
        this.title = `Player ${this.id + 1}`
        this.animTitle = `player${this.id}`

        this.hp = 50;
        this.attack = 15;
        this.dodge = 25;

        this.animFrameStack = []
    }

    makeAction(action, otherPlayer, stat){
        if(!gameRunning){
            return
        }

        if(action == "attack"){
            return this.attackPlayer(otherPlayer)
        }else if(action == "heal"){
            return this.heal()
        }else if(action == "lower"){
            this.lowerStat(otherPlayer, stat)
        }
    }

    attackPlayer(otherPlayer){
        this.pushToAnimStack(animationFrames.attack, true)
        
        let dmg = this.attack
        return otherPlayer.dealDmg(dmg)
    }
    
    heal(){
        if(Math.random() >= .5){
            this.pushToAnimStack(animationFrames.heal, true)
            const healedHp = Math.trunc(Math.random() * 5) + 15
            this.hp += healedHp
            return healedHp
        }
        return 0
    }

    lowerStat(otherPlayer, stat){
        if(stat == "attack"){
            otherPlayer.pushToAnimStack(animationFrames.lowerAttack, true)
            otherPlayer[stat]--;
        }else if(stat == "dodge"){
            otherPlayer.pushToAnimStack(animationFrames.lowerDodge, true)
            otherPlayer[stat] -= 5;
        }
    }

    dealDmg(dmg){
        const randomDodgeChance = Math.trunc(Math.random() * 100) + 1
        if(randomDodgeChance < this.dodge){
            this.pushToAnimStack(animationFrames.dodge, true)
            return 0
        }else{
            this.pushToAnimStack(animationFrames.takeDmg, true)
            this.hp -= dmg
            return dmg
        }
    }

    updateStatDisplay(){
        let statDisplay = document.querySelector(`#playerControls${this.id} .statDisplay`)

        statDisplay.innerText = `Health: ${this.hp} \n Attack: ${this.attack} \n Dodge chance: ${this.dodge}% \n Heal chance: 50%`
    }

    returnStats(){
        return {
            id: this.id,
            title: this.title,
            hp: this.hp,
            attack: this.attack,
            dodge: this.dodge,
        }
    }

    updateData(playerObj){
        if(playerObj.id == this.id){
            this.hp = playerObj.hp
            this.attack = playerObj.attack
            this.dodge = playerObj.dodge
        }
    }

    pushToAnimStack(newAnimFrames, startFresh){
        if(startFresh == true){
            this.animFrameStack = []
        }

        newAnimFrames.forEach((frame) => {
            this.animFrameStack.push(frame)
        })
    }

    playAnimation(){
        const playerImg = document.querySelector(`#${this.animTitle}Img`)
        playerImg.src = `./imgs/${this.animTitle}/${this.animFrameStack[0]}.png`
        this.animFrameStack.shift()
    }
}

const playerDivs = document.querySelector("#playerDivs")
const notificationDiv = document.querySelector("#notificationDiv")

// const apiUri = "http://localhost:3000"
const apiUri = "http://192.168.0.162:3000"

const animationFrames = {
    idle: ["idle0", "idle1", "idle2", "idle3"],
    attack: ["attack"],
    dodge: ["dodge"],
    heal: ["heal0", "heal1", "heal2", "heal3"],
    takeDmg: ["getHit", "lost", "getHit"],
    lowerAttack: ["lowerAttack0", "lowerAttack1", "lowerAttack2"],
    lowerDodge: ["lowerDodge0", "lowerDodge1", "lowerDodge2"],
    lost: ["lost"]
}

let players = [new Player(0), new Player(1)];
// let currentTurn = Math.round(Math.random());
let currentTurn = 0;
let playerPlayed = null
let gameRunning = true
let clearNotificationTimeout = 0;
let password = null


async function handleActionClick(notificationText, dontChangeTurn){
    if(dontChangeTurn != true){
        currentTurn = (currentTurn + 1) % 2
    }

    const gameState = {
        playerData: [
            players[0].returnStats(),
            players[1].returnStats(),
        ],
        notificationText,
        currentTurn,
        password,
    }

    const data = await fetch(`${apiUri}/moveMade`, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(gameState)
    })

    if(data.status == 200){
        setGameStateAfterFetch()
    }

    updateVisuals(notificationText)
    localStorage.setItem("gameState", JSON.stringify(gameState))
}

function updateVisuals(notificationText, winnerId){
    if( document.querySelector(`#playerControls${(currentTurn + 1) % 2} .yourTurnDiv`) != undefined){
        document.querySelector(`#playerControls${(currentTurn + 1) % 2} .yourTurnDiv`).style.display = "none"
    }
    if( document.querySelector(`#playerControls${currentTurn} .yourTurnDiv`) != undefined){
        document.querySelector(`#playerControls${currentTurn} .yourTurnDiv`).style.display = "flex"
    }

    let someoneWon = winnerId != undefined

    players.forEach((player) => {
        player.updateStatDisplay()

        if(player.hp <= 0){
            someoneWon = `${Number(players[0].hp < players[1].hp)}`
        }
    })

    if(someoneWon && notificationText != undefined){
        notificationText = `${notificationText} \n ${players[someoneWon].title} won!`
        localStorage.clear()
        gameRunning = false
    }

    if(notificationText != undefined){
        displayNotification(notificationText, someoneWon)
    }
}

async function setGameStateAfterFetch(){
    if(!gameRunning){
        return
    }

    const data = await fetch(`${apiUri}/waitUntilMoveMade`, {
        method: "get",
        headers:{
            "Keep-Alive": "timeout=20, max=100"
        }
    })
    const dataJson = await data.json()

    if(data.status != 200){
        setGameStateAfterFetch()
        return
    }

    if(dataJson.state.winner != undefined){
        currentTurn = -1
        gameRunning = false
    }

    currentTurn = (currentTurn + 1) % 2
    players[0].updateData(dataJson.state.playerData[0])
    players[1].updateData(dataJson.state.playerData[1])
    updateVisuals(dataJson.state.notificationText, dataJson.state.winner)

    const gameState = {
        playerData: [
            players[0].returnStats(),
            players[1].returnStats(),
        ],
        notificationText: dataJson.state.notificationText,
        password,
        currentTurn
    }

    localStorage.setItem("gameState", JSON.stringify(gameState))
}

function displayNotification(text, permanent){
    notificationDiv.innerText = text;
    notificationDiv.style.display = "block"
    
    clearTimeout(clearNotificationTimeout)
    
    if(!permanent){
        clearNotificationTimeout = setTimeout(() => {
            notificationDiv.innerText = "";
            notificationDiv.style.display = "none"
            clearNotificationTimeout = 0;
        }, 5000)
    }
}

function animationManager(){
    setInterval(() => {
        players.forEach((player) => {
            if(player.animFrameStack.length <= 1){
                player.pushToAnimStack([...animationFrames.idle])
            }

            player.playAnimation()
        })
    }, 500)
}

async function startGame(){
    if(localStorage.getItem("connGameInfo") == undefined){
        location.href = "index.html"
    }

    let connGameInfo = JSON.parse(localStorage.getItem("connGameInfo"))
    playerPlayed = connGameInfo.playerId
    password = connGameInfo.password

    if(localStorage.getItem("gameState") != undefined){
        let state = JSON.parse(localStorage.getItem("gameState"))

        players[0].updateData(state.playerData[0])
        players[1].updateData(state.playerData[1])
        currentTurn = state.currentTurn
    }

    for(let i = 0; i < players.length; i++){
        const player = players[i];
        const opponent = i == 0 ? players[1] : players[0]

        const playerControls = document.createElement("div");
        playerControls.classList.add("playerControls")
        playerControls.id = `playerControls${i}`

        const playerImg = document.createElement("img");
        playerImg.classList.add("playerImg")
        playerImg.id = `player${i}Img`
        playerImg.src = `./imgs/player${i}/idle0.png`

        const textDiv = document.createElement("div")
        textDiv.classList.add("playerTexts")

        const statAndTitleDiv = document.createElement("div")
        statAndTitleDiv.classList.add("statAndTitleDiv")

        const statDisplay = document.createElement("div")
        statDisplay.classList.add("statDisplay")

        const h1Title = document.createElement("h1")
        h1Title.innerText = player.title

        const yourTurnDiv = document.createElement("div")
        yourTurnDiv.classList.add("yourTurnDiv")
        yourTurnDiv.innerText = "YOUR TURN"

        let buttonsDiv = document.createElement("div")
        buttonsDiv.classList.add("playerBtns")

        let attackBtn = null
        let healBtn = null
        let lowerAttack = null
        let lowerDodge = null
        if(playerPlayed == i){

            attackBtn = document.createElement("button")
            attackBtn.innerText = "Attack"
            attackBtn.id = "attackBtn"
            attackBtn.addEventListener("click", () => {
                if(currentTurn == player.id){
                    let dealtDmg = player.makeAction("attack", opponent)
                    let notificationMsg = ""

                    if(dealtDmg == 0){
                        notificationMsg = `${opponent.title} dodged ${player.title}'s attack!`
                    }else{
                        notificationMsg = `${opponent.title} got hit for ${dealtDmg} hp!`
                    }

                    handleActionClick(notificationMsg)
                }
            })

            healBtn = document.createElement("button")
            healBtn.innerText = "Heal"
            healBtn.id = "healBtn"
            healBtn.addEventListener("click", () => {
                if(currentTurn == player.id){
                    let healedHp = player.makeAction("heal")
                    let notificationMsg = ""

                    if(healedHp == 0){
                        notificationMsg = `${player.title}'s heal wasn't successful!`
                    }else{
                        notificationMsg = `${player.title} healed ${healedHp} hp!`
                    }

                    handleActionClick(notificationMsg)
                }
            })

            lowerAttack = document.createElement("button")
            lowerAttack.innerText = "Lower Enemy Attack"
            lowerAttack.id = "lowerAttackBtn"
            lowerAttack.addEventListener("click", () => {
                if(currentTurn == player.id){
                    if(opponent.attack >= 1){
                        player.makeAction("lower", opponent, "attack")
                        handleActionClick(`You lowered ${opponent.title} attack!`)
                    }else{
                        displayNotification(`You cant lower ${opponent.title} attack any further!`)
                    }
                }
            })
            
            lowerDodge = document.createElement("button")
            lowerDodge.innerText = "Lower Enemy Dodge"
            lowerDodge.id = "lowerDodgeBtn"
            lowerDodge.addEventListener("click", () => {
                if(currentTurn == player.id){
                    if(opponent.dodge >= 1){
                        player.makeAction("lower", opponent, "dodge")
                        handleActionClick(`You lowered ${opponent.title} dodge!`)
                    }else{
                        displayNotification(`You cant lower ${opponent.title} dodge any further!`)
                    }
                }
            })
        }

        statAndTitleDiv.appendChild(h1Title)
        statAndTitleDiv.appendChild(statDisplay)

        textDiv.appendChild(statAndTitleDiv)
        textDiv.appendChild(yourTurnDiv)

        if(playerPlayed == i){
            buttonsDiv.appendChild(attackBtn)
            buttonsDiv.appendChild(healBtn)
            buttonsDiv.appendChild(lowerAttack)
            buttonsDiv.appendChild(lowerDodge)
        }

        playerControls.appendChild(playerImg)
        playerControls.appendChild(textDiv)
        playerControls.appendChild(buttonsDiv)

        playerDivs.appendChild(playerControls)
    }

    players.forEach((player) => {
        player.updateStatDisplay()
    })

    updateVisuals()
    animationManager()
    if(playerPlayed == 1 && localStorage.getItem("gameState") == undefined){
        setGameStateAfterFetch()
    }
    if(currentTurn != playerPlayed && localStorage.getItem("gameState") != undefined){
        setGameStateAfterFetch()
    }
}

startGame()