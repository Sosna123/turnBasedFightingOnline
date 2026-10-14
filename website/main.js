class Player{
    constructor(startId){
        this.id = startId
        this.hp = 50;
        this.attack = 15;
        this.dodge = 25;
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
        let dmg = this.attack
        return otherPlayer.dealDmg(dmg)
    }

    heal(){
        if(Math.random() >= .5){
            const healedHp = Math.trunc(Math.random() * 5) + 15
            this.hp += healedHp
            return healedHp
        }
        return 0
    }

    lowerStat(otherPlayer, stat){
        if(stat == "attack"){
            otherPlayer[stat]--;
        }else if(stat == "dodge"){
            otherPlayer[stat] -= 5;
        }
    }

    dealDmg(dmg){
        const randomDodgeChance = Math.trunc(Math.random() * 100) + 1
        if(randomDodgeChance < this.dodge){
            return 0
        }else{
            this.hp -= dmg
            return dmg
        }
    }

    updateStatDisplay(){
        let statDisplay = document.querySelector(`#playerControls${this.id} > .statDisplay`)

        statDisplay.innerText = `Health: ${this.hp} \n Attack: ${this.attack} \n Dodge: ${this.dodge}%`
    }

    returnStats(){
        return {
            id: this.id,
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
}

const playerDivs = document.querySelector("#playerDivs")
const notificationDiv = document.querySelector("#notificationDiv")

const apiUri = "http://localhost:3000"

let players = [new Player(0), new Player(1)];
// let currentTurn = Math.round(Math.random());
let currentTurn = 0;
let playerPlayed = null
let gameRunning = true
let clearNotificationTimeout = 0;


async function handleActionClick(notificationText, dontChangeTurn){
    if(dontChangeTurn != true){
        currentTurn = (currentTurn + 1) % 2
    }

    const data = await fetch(`${apiUri}/moveMade`, {
        method: "post",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            playerData: [
                players[0].returnStats(),
                players[1].returnStats(),
            ],
            notificationText
        })
    })

    if(data.status == 200){
        setGameStateAfterFetch()
    }

    updateVisuals(notificationText)
}

function updateVisuals(notificationText){
    if(document.querySelector(`.playerControls.currentPlayer`) != undefined){
        document.querySelector(`.playerControls.currentPlayer`).classList.remove("currentPlayer")
    }
    document.querySelector(`#playerControls${currentTurn}`).classList.add("currentPlayer")

    players.forEach((player) => {
        player.updateStatDisplay()
    })

    if(notificationText != undefined){
        displayNotification(notificationText)
    }
}

async function setGameStateAfterFetch(){
    const data = await fetch(`${apiUri}/waitUntilMoveMade`, {
        method: "get",
        headers:{
            "Keep-Alive": "timeout=31, max=100"
        }
    })
    const dataJson = await data.json()

    if(await data.status != 200){
        setGameStateAfterFetch()
        return
    }

    currentTurn = (currentTurn + 1) % 2
    players[0].updateData(dataJson.state.playerData[0])
    players[1].updateData(dataJson.state.playerData[1])
    updateVisuals(dataJson.state.notificationText)
}

function checkWinCondition(){
    players.forEach((player) => {
        if(player.hp <= 0){
            gameRunning = false
            displayNotification(`Player ${currentTurn + 1} has won!`, false)
            currentTurn = -1
            return
        }
    })
}

function displayNotification(text){
    notificationDiv.innerText = text;
    notificationDiv.style.display = "block"
    
    clearTimeout(clearNotificationTimeout)
    
    clearNotificationTimeout = setTimeout(() => {
        notificationDiv.innerText = "";
        notificationDiv.style.display = "none"
        clearNotificationTimeout = 0;
    }, 5000)
}

async function startGame(){
    const data = await fetch(`${apiUri}/connect`, {
        method: "get",
    })

    const dataJson = await data.json()

    playerPlayed = dataJson.playerId


    for(let i = 0; i < players.length; i++){
        const player = players[i];
        const opponent = i == 0 ? players[1] : players[0]

        const playerControls = document.createElement("div");
        playerControls.classList.add("playerControls")
        playerControls.id = `playerControls${i}`

        const h1Title = document.createElement("h1")
        h1Title.innerText = `Player ${i + 1}`

        const attackBtn = document.createElement("button")
        attackBtn.innerText = "Attack"
        attackBtn.addEventListener("click", () => {
            if(currentTurn == player.id){
                let dealtDmg = player.makeAction("attack", opponent)
                let notificationMsg = ""

                if(dealtDmg == 0){
                    notificationMsg = `Enemy dodged your attack!`
                }else{
                    notificationMsg = `You've dealt ${dealtDmg} dmg!`
                }

                handleActionClick(notificationMsg)
            }
        })

        const healBtn = document.createElement("button")
        healBtn.innerText = "Heal"
        healBtn.addEventListener("click", () => {
            if(currentTurn == player.id){
                let healedHp = player.makeAction("heal")
                let notificationMsg = ""

                if(healedHp == 0){
                    notificationMsg = `Heal wasn't successful!`
                }else{
                    notificationMsg = `You healed ${healedHp} hp!`
                }

                handleActionClick(notificationMsg)
            }
        })

        const lowerAttack = document.createElement("button")
        lowerAttack.innerText = "Lower Enemy Attack"
        lowerAttack.addEventListener("click", () => {
            if(currentTurn == player.id){
                if(opponent.attack >= 1){
                    player.makeAction("lower", opponent, "attack")
                    handleActionClick(`You lowered enemy attack!`)
                }else{
                    displayNotification(`You cant lower enemy attack any further!`)
                }
            }
        })
        
        const lowerDodge = document.createElement("button")
        lowerDodge.innerText = "Lower Enemies Dodge"
        lowerDodge.addEventListener("click", () => {
            if(currentTurn == player.id){
                if(opponent.dodge >= 1){
                    player.makeAction("lower", opponent, "dodge")
                    handleActionClick(`You lowered enemy dodge!`)
                }else{
                    displayNotification(`You cant lower enemy dodge any further!`)
                }
            }
        })
        
        const statDisplay = document.createElement("div")
        statDisplay.classList.add("statDisplay")
        
        if(playerPlayed != i){
            attackBtn.setAttribute("disabled", "true")  
            healBtn.setAttribute("disabled", "true")    
            lowerAttack.setAttribute("disabled", "true")
            lowerDodge.setAttribute("disabled", "true") 
        }
        playerControls.appendChild(h1Title)
        playerControls.appendChild(statDisplay)
        playerControls.appendChild(attackBtn)
        playerControls.appendChild(healBtn)
        playerControls.appendChild(lowerAttack)
        playerControls.appendChild(lowerDodge)

        playerDivs.appendChild(playerControls)
    }

    players.forEach((player) => {
        player.updateStatDisplay()
    })

    updateVisuals()
    if(playerPlayed == 1){
        setGameStateAfterFetch()
    }
}

startGame()