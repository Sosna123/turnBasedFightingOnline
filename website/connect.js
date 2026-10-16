const connectBtn = document.querySelector("#connectBtn")
const errors = document.querySelector("#errors")
const apiUri = "http://192.168.0.162:3000"

connectBtn.addEventListener("click", async () => {
    let data = null
    try{
        data = await fetch(`${apiUri}/connect`, {
            method: "get",
        })
    }catch(e){
        errors.innerText = `Error while connecting: can't connect to server`
        return
    }

    const dataJson = await data.json()

    if(data.status == 200){
        localStorage.clear()
        localStorage.setItem("connGameInfo", JSON.stringify({playerId: dataJson.playerId, password: dataJson.password}))
        
        if(dataJson.state != null){
            localStorage.setItem("gameState", JSON.stringify(dataJson.state))
        }

        location.href = "game.html"
    }else{
        errors.innerText = `Error while connecting: ${dataJson.text}`
    }
})