const connectBtn = document.querySelector("#connectBtn")
const errors = document.querySelector("#errors")
const apiUri = "http://192.168.0.162:3000"

connectBtn.addEventListener("click", async () => {
    const data = await fetch(`${apiUri}/connect`, {
        method: "get",
    })

    const dataJson = await data.json()

    if(data.status == 200){
        location.href = "game.html"
        localStorage.clear()
        localStorage.setItem("connGameInfo", JSON.stringify({playerId: dataJson.playerId, password: dataJson.password}))
    }else{
        errors.innerText = `Error while connecting: ${dataJson.text}`
    }
})