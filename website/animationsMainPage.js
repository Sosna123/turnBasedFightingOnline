const player0 = document.querySelector("#player0")
const player1 = document.querySelector("#player1")
const idle = ["idle0", "idle1", "idle2", "idle3"]

let playerAnims = ["idle0", "idle1", "idle2", "idle3"]

setInterval(() => {
    if(playerAnims.length <= 1){
        playerAnims.push(...["idle0", "idle1", "idle2", "idle3"])
    }

    player0.src = `./assets/imgs/player0/${playerAnims[0]}.png`
    player1.src = `./assets/imgs/player1/${playerAnims[0]}.png`

    playerAnims.shift()
}, 500)