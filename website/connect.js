const connectBtn = document.querySelector("#connectBtn")
const infoBtn = document.querySelector("#infoBtn")
const localBtn = document.querySelector("#localBtn")
const customIdCheckbox = document.querySelector("#customIdCheckbox")
const customIdDiv = document.querySelector("#customIdDiv")
const customId = document.querySelector("#customId")
const errors = document.querySelector("#errors")

let apiUri = "https://frog01-31260.wykr.es"
if(localStorage.getItem("dev") == "true"){
    apiUri = "http://192.168.0.162:3000"
}

function setDev(){
    localStorage.setItem("dev", "true")
    apiUri = "http://192.168.0.162:3000"
}

const defaultState = {
    playerData: null,
    notificationText: null,
    currentTurn: 0,
    password: null,
    gameId: -1
}

customIdCheckbox.addEventListener("click", () => {
    customIdDiv.style.display = customIdCheckbox.checked ? "block" : "none"
})

if(customIdCheckbox.checked){
   customIdDiv.style.display = "block"
}

infoBtn.addEventListener("click", () => {
    location.href = "info.html"
})

connectBtn.addEventListener("click", async () => {
    let data = null
    let customIdParsed = customId.value

    if(customIdParsed.length > 16){
        customIdParsed = customIdParsed.substring(0, 16)
    }

    if(customIdParsed){
        try{
            data = await fetch(`${apiUri}/connect`, {
                method: "post",
                headers:{
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id: customIdParsed})
            })
        }catch(e){
            errors.innerText = `Error while connecting: can't connect to server`
            return
        }
    }else{
        try{
            data = await fetch(`${apiUri}/connect`, {
                method: "get",
            })
        }catch(e){
            errors.innerText = `Error while connecting: can't connect to server`
            return
        }
    }


    const dataJson = await data.json()

    if(data.status == 200){
        localStorage.clear()
        localStorage.setItem("connGameInfo", JSON.stringify({playerId: dataJson.playerId, password: dataJson.password, locally: false, gameId: dataJson.gameId}))
        
        if(dataJson.state != null){
            localStorage.setItem("gameState", JSON.stringify(dataJson.state))
        }

        location.href = "game.html"
    }else{
        errors.innerText = `Error while connecting: ${dataJson.text}`
    }
})

localBtn.addEventListener("click", async () => {
    localStorage.clear()
    localStorage.setItem("connGameInfo", JSON.stringify({playerId: -1, password: null, locally: true, gameId: -1}))
    localStorage.setItem("gameState", JSON.stringify(defaultState))

    location.href = "game.html"
})