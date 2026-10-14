const connectBtn = document.querySelector("#connectBtn")
const apiUri = "http://192.168.0.162:3000"

connectBtn.addEventListener("click", async () => {
    const data = await fetch(`${apiUri}/connect`, {
        method: "get",
    })

    const dataJson = await data.json()

    location.href = "game.html"
    localStorage.setItem("connGameInfo", JSON.stringify({playerId: dataJson.playerId}))
})