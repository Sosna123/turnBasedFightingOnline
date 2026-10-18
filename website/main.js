class Player{
    constructor(startId){
        this.id = startId
        this.title = `Player ${this.id + 1}`
        this.animTitle = `player${this.id}`

        this.maxHp = 100
        this.hp = this.maxHp;
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
        this.pushToAnimStack("attack", true)
        
        let dmg = this.attack
        return otherPlayer.getHit(dmg)
    }
    
    heal(){
        if(Math.random() >= .5){
            this.pushToAnimStack("heal", true)
            let healedHp = Math.trunc(Math.random() * 5) + 15

            if(this.hp + healedHp > this.maxHp){
                healedHp = this.maxHp - this.hp
                this.hp = this.maxHp
            }else{
                this.hp += healedHp
            }

            return healedHp
        }
        return 0
    }

    lowerStat(otherPlayer, stat){
        if(stat == "attack"){
            otherPlayer.pushToAnimStack("lowerAttack", true)
            otherPlayer[stat]--;
        }else if(stat == "dodge"){
            otherPlayer.pushToAnimStack("lowerDodge", true)
            otherPlayer[stat] -= 5;
        }
    }

    getHit(dmg){
        const randomDodgeChance = Math.trunc(Math.random() * 100) + 1
        if(randomDodgeChance < this.dodge){
            this.pushToAnimStack("dodge", true)
            return 0
        }else{
            this.playRandomSound("getHit")
            this.pushToAnimStack("takeDmg", true)
            this.hp -= dmg

            if(this.hp < 0){
                this.hp = 0
            }

            return dmg
        }

    }

    updateStatDisplay(){
        let statDisplay = document.querySelector(`#playerControls${this.id} .statDisplay .textStats`)
    
        statDisplay.innerText = `Attack: ${this.attack}\n Dodge chance: ${this.dodge}%\n Heal chance: 50%`

        let hpBarProgress = document.querySelector(`#playerControls${this.id} .hpBarOutline .hpBarProgress`)
        hpBarProgress.innerText = `${this.hp}/${this.maxHp}`

        let hpPercentProgress = Math.min(this.hp, this.maxHp) / this.maxHp
        hpBarProgress.style.width = `${hpPercentProgress * 100}%`
    }

    returnStats(){
        return {
            id: this.id,
            title: this.title,
            hp: this.hp,
            attack: this.attack,
            dodge: this.dodge,
            lastAnimation: this.lastAnimation
        }
    }

    updateData(playerObj){
        if(playerObj.id == this.id){
            this.hp = playerObj.hp
            this.attack = playerObj.attack
            this.dodge = playerObj.dodge

            if(playerObj.lastAnimation != "idle" || playerObj.lastAnimation != undefined){
                this.pushToAnimStack(playerObj.lastAnimation, true)
            }
        }
    }

    pushToAnimStack(newAnimFrames, startFresh){
        this.lastAnimation = newAnimFrames

        if(startFresh == true){
            this.animFrameStack = []
        }

        animationFrames[newAnimFrames].forEach((frame) => {
            this.animFrameStack.push(frame)
        })
    }

    playAnimation(){
        const playerImg = document.querySelector(`#${this.animTitle}Img`)
        playerImg.src = `./assets/imgs/${this.animTitle}/${this.animFrameStack[0]}.png`
        this.animFrameStack.shift()
    }

    playRandomSound(typeOfSfx){
        if(soundTurnedOn){
            let randomSoundId = Math.trunc(Math.random() * (allSfxTypes[typeOfSfx].length - 1))
            let randomSound = allSfxTypes[typeOfSfx][randomSoundId]
            let playAudio = new Audio(`./assets/sfx/${randomSound}.wav`)
            playAudio.play()
        }
    }
}

const playerDivs = document.querySelector("#playerDivs")
const notificationDiv = document.querySelector("#notificationDiv")
const turnOffSound = document.querySelector("#turnOffSound")

// const apiUri = "http://localhost:3000"
const apiUri = "http://192.168.0.162:3000"

const animationFrameTime = 500
const animationFrames = {
    idle: ["idle0", "idle1", "idle2", "idle3"],
    attack: ["attack"],
    dodge: ["dodge"],
    heal: ["heal0", "heal1", "heal2", "heal3"],
    takeDmg: ["getHit", "lost", "getHit"],
    lowerAttack: ["lowerAttack0", "lowerAttack1", "lowerAttack2"],
    lowerDodge: ["lowerDodge0", "lowerDodge1", "lowerDodge2"],
    lost: ["getHit", "lost", "lostTear0", "lostTear1", "lostTear2", "lost"],
    win: ["win0", "win1", "win2", "win2", "win2", "win2"]
}

const allSfxTypes = {
    getHit: ["grunt1"]
}

let players = [new Player(0), new Player(1)];
// let currentTurn = Math.round(Math.random());
let currentTurn = 0;
let gameRunning = true;
let clearNotificationTimeout = 0;
let animationInterval = null;
let soundTurnedOn = true

let gameInfo = {
    playerPlayed: null,
    password: null,
    gameId: null,
    playedLocally: null
}


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
        password: gameInfo.password,
        gameId: gameInfo.gameId
    }

    if(!gameInfo.playedLocally){
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
        notificationText = `${notificationText}\n ${players[someoneWon].title} won!\n Click here to return to main menu`
        localStorage.clear()

        players.forEach((player, index) => {
            if(index == someoneWon){
                player.pushToAnimStack("win", true)
            }else{
                player.pushToAnimStack("lost", true)
            }

            setTimeout(() => {
                if(animationInterval != null){
                    clearInterval(animationInterval)
                }
            }, animationFrameTime * animationFrames.lost.length)
        })

        gameRunning = false
        currentTurn = -1;

        if( document.querySelector(`#playerControls0 .yourTurnDiv`) != undefined){
            document.querySelector(`#playerControls0 .yourTurnDiv`).style.display = "none"
        }
        if( document.querySelector(`#playerControls1 .yourTurnDiv`) != undefined){
            document.querySelector(`#playerControls1 .yourTurnDiv`).style.display = "none"
        }
    }

    if(notificationText != undefined){
        displayNotification(notificationText, someoneWon)
    }
}

async function setGameStateAfterFetch(){
    if(!gameRunning){
        return
    }

    let data = null
    try{
        data = await fetch(`${apiUri}/waitUntilMoveMade`, {
            method: "get",
            headers:{
                "Keep-Alive": "timeout=20, max=100"
            }
        })
    }catch(e){
        setGameStateAfterFetch()
        return
    }
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

function displayNotification(text, gameEnded){
    notificationDiv.innerText = text;
    notificationDiv.style.display = "block"
    
    clearTimeout(clearNotificationTimeout)
    
    if(gameEnded){
        notificationDiv.addEventListener("click", () => {
            location.href = "index.html"
        })
    }else{
        clearNotificationTimeout = setTimeout(() => {
            notificationDiv.innerText = "";
            notificationDiv.style.display = "none"
            clearNotificationTimeout = 0;
        }, 5000)
    }
}

function animationManager(){
    animationInterval = setInterval(() => {
        players.forEach((player) => {
            if(player.animFrameStack.length <= 1){
                player.pushToAnimStack("idle")
            }

            player.playAnimation()
        })
    }, animationFrameTime)
}

async function startGame(){
    if(localStorage.getItem("connGameInfo") == undefined){
        location.href = "index.html"
    }

    let connGameInfo = JSON.parse(localStorage.getItem("connGameInfo"))
    gameInfo.playerPlayed = connGameInfo.playerId
    gameInfo.password = connGameInfo.password
    gameInfo.gameId = connGameInfo.gameId
    gameInfo.playedLocally = connGameInfo.locally

    if(localStorage.getItem("gameState") != undefined){
        let state = JSON.parse(localStorage.getItem("gameState"))

        if(state.playerData){
            players[0].updateData(state.playerData[0])
            players[1].updateData(state.playerData[1])
        }
        currentTurn = state.currentTurn
    }

    let imgsToPreload = ["fighterBackground0", "fighterBackground1", "player0/idle0", "player0/idle1", "player0/idle2", "player0/idle3", "player1/idle0", "player1/idle1", "player1/idle2", "player1/idle3"]

    imgsToPreload.forEach(img => {
        const imgLoader = new Image()
        imgLoader.src = `./assets/imgs/${img}.png`
    })

    for(let i = 0; i < players.length; i++){
        const player = players[i];
        const opponent = i == 0 ? players[1] : players[0]

        const playerControls = document.createElement("div");
        playerControls.classList.add("playerControls")
        playerControls.id = `playerControls${i}`

        const playerImg = document.createElement("img");
        playerImg.classList.add("playerImg")
        playerImg.id = `player${i}Img`
        playerImg.setAttribute("draggable", "false")
        playerImg.src = `./assets/imgs/player${i}/idle0.png`

        const textDiv = document.createElement("div")
        textDiv.classList.add("playerTexts")

        const statAndTitleDiv = document.createElement("div")
        statAndTitleDiv.classList.add("statAndTitleDiv")

        const statDisplay = document.createElement("div")
        statDisplay.classList.add("statDisplay")

        const hpBarOutline = document.createElement("div")
        hpBarOutline.classList.add("hpBarOutline")
        
        const hpBarProgress = document.createElement("div")
        hpBarProgress.classList.add("hpBarProgress")

        const textStats = document.createElement("div")
        textStats.classList.add("textStats")

        const h1Title = document.createElement("h1")
        h1Title.innerText = player.title

        const yourTurnDiv = document.createElement("div")
        yourTurnDiv.classList.add("yourTurnDiv")

        let buttonsDiv = document.createElement("div")
        buttonsDiv.classList.add("playerBtns")

        let attackBtn = null
        let healBtn = null
        let lowerAttack = null
        let lowerDodge = null
        if(gameInfo.playerPlayed == i || gameInfo.playedLocally){

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
                    if(player.hp >= player.maxHp){
                        displayNotification(`You are already at max hp!`)
                        return
                    }

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
                    if(opponent.attack > 5){
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

        hpBarOutline.appendChild(hpBarProgress)

        statDisplay.appendChild(hpBarOutline)
        statDisplay.appendChild(textStats)

        statAndTitleDiv.appendChild(h1Title)
        statAndTitleDiv.appendChild(statDisplay)

        textDiv.appendChild(statAndTitleDiv)
        textDiv.appendChild(yourTurnDiv)

        if(gameInfo.playerPlayed == i || gameInfo.playedLocally){
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

    if(!gameInfo.playedLocally){
        if(gameInfo.playerPlayed == 1 && localStorage.getItem("gameState") == undefined){
            setGameStateAfterFetch()
        }
        if(currentTurn != gameInfo.playerPlayed && localStorage.getItem("gameState") != undefined){
            setGameStateAfterFetch()
        }
    }

    let bg = document.querySelector("#fightersBackground")
    setInterval(() => {
        let newImg = "./assets/imgs/fighterBackground0.png"
        if(bg.style.backgroundImage.includes("fighterBackground0.png")){
            newImg = "./assets/imgs/fighterBackground1.png"
        }
        bg.style.backgroundImage = `url(${newImg})`
    }, animationFrameTime)
}

turnOffSound.addEventListener("click", () => {
    soundTurnedOn = !soundTurnedOn
    localStorage.setItem("soundTurnedOn", soundTurnedOn)

    let soundImg = document.querySelector("#turnOffSound > img")
    if(soundTurnedOn){
        soundImg.setAttribute("src", "./assets/imgs/muteButton.png")
    }else{
        soundImg.setAttribute("src", "./assets/imgs/muteButtonOff.png")
    }
})

if(localStorage.getItem("soundTurnedOn") == "false" || localStorage.getItem("soundTurnedOn") == "true"){
    soundTurnedOn = localStorage.getItem("soundTurnedOn") == "true" ? true : false
    soundTurnedOn = !soundTurnedOn
    turnOffSound.click()
}

startGame()