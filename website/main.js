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
}

const playerDivs = document.querySelector("#playerDivs")
const notificationDiv = document.querySelector("#notificationDiv")
let clearNotificationTimeout = 0;

let players = [new Player(0), new Player(1)];
let currentTurn = Math.round(Math.random());
let gameRunning = true


function handleActionClick(playerClicked){
    if(playerClicked == currentTurn){
        document.querySelector(`#playerControls${currentTurn}`).classList.remove("currentPlayer")
        currentTurn = (currentTurn + 1) % 2
        document.querySelector(`#playerControls${currentTurn}`).classList.add("currentPlayer")

        players.forEach((player) => {
            player.updateStatDisplay()
        })
    }
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

function startGame(){
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
                handleActionClick(i)
                if(dealtDmg == 0){
                    displayNotification(`Enemy dodged your attack!`)
                }else{
                    displayNotification(`You've dealt ${dealtDmg} dmg!`)
                }
            }
        })

        const healBtn = document.createElement("button")
        healBtn.innerText = "Heal"
        healBtn.addEventListener("click", () => {
            if(currentTurn == player.id){
                let healedHp = player.makeAction("heal")
                if(healedHp == 0){
                    displayNotification(`Heal wasn't successful!`)
                }else{
                    displayNotification(`You healed ${healedHp} hp!`)
                }
                handleActionClick(i)
            }
        })

        const lowerAttack = document.createElement("button")
        lowerAttack.innerText = "Lower Enemy Attack"
        lowerAttack.addEventListener("click", () => {
            if(currentTurn == player.id){
                if(opponent.attack >= 1){
                    player.makeAction("lower", opponent, "attack")
                    displayNotification(`You lowered enemy attack!`)
                    handleActionClick(i)
                }else{
                    displayNotification(`You cant lower enemy attack any further!`)
                    // warn player that they cant anymore
                }
            }
        })
        
        const lowerdodge = document.createElement("button")
        lowerdodge.innerText = "Lower Enemies Dodge"
        lowerdodge.addEventListener("click", () => {
            if(currentTurn == player.id){
                if(opponent.dodge >= 1){
                    player.makeAction("lower", opponent, "dodge")
                    displayNotification(`You lowered enemy dodge!`)
                    handleActionClick(i)
                }else{
                    displayNotification(`You cant lower enemy dodge any further!`)
                    // warn player that they cant anymore
                }
            }
        })
        
        const statDisplay = document.createElement("div")
        statDisplay.classList.add("statDisplay")
        
        playerControls.appendChild(h1Title)
        playerControls.appendChild(statDisplay)
        playerControls.appendChild(attackBtn)
        playerControls.appendChild(healBtn)
        playerControls.appendChild(lowerAttack)
        playerControls.appendChild(lowerdodge)

        playerDivs.appendChild(playerControls)
    }

    players.forEach((player) => {
        player.updateStatDisplay()
    })

    handleActionClick(currentTurn)
    checkWinCondition()
}

startGame()