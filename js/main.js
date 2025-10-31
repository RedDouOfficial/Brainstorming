const inputAreaEle = document.querySelector("#input-area")
const stageEle = document.querySelector("#stage")
const sideBarEle = document.querySelector("#side-bar")
const topicEle = document.querySelector("#topic")
const fileExplorerEle = document.querySelector("#file-explorer")
const toolBarEle = document.querySelector("#toolbar")

let appState

if (localStorage.getItem("appState")) {
    appState = JSON.parse(localStorage.getItem("appState"))
}
else {
    appState = {
        notes: {
            "10000000": {
                topic: "Object To BUY",
                cards: {},
                id: "10000000"
            }
        },
        currentNoteId: "10000000",
        sideBarWidth: 200,
        secretMode: false
    }
}


function writeToLocal() {
    localStorage.setItem("appState", JSON.stringify(appState))
}

function updateOrCreateCard(card) {
    let cardEle = document.querySelector(`[data-id="${card.created}"]`)
    if (cardEle === null) {
        cardEle = document.createElement("div")
        cardEle.className = "miniCard"
        cardEle.dataset.id = card.created
        stageEle.prepend(cardEle)
    }

    cardEle.style.position = card.stylePosition
    cardEle.style.left = card.position[0]
    cardEle.style.top = card.position[1]
    cardEle.style.zIndex = card.zIndex
    cardEle.textContent = card.content
    cardEle.style.background = card.bgc
}

function updateFileExplorerView() {
    fileExplorerEle.innerHTML = ""
    for (let id in appState.notes) {
        const optionEle = document.createElement("option")
        optionEle.value = id
        optionEle.textContent = appState.notes[id].topic
        fileExplorerEle.appendChild(optionEle)
    }
    fileExplorerEle.value = appState.currentNoteId
}

fileExplorerEle.addEventListener("change", e => {
    switchNote(fileExplorerEle.value)
})

function switchNote(id) {
    appState.currentNoteId = id
    writeToLocal()
    initAll()
}


function initAll() {
    updateFileExplorerView()
    updateSecretModeView()
    stageEle.innerHTML = ""
    sideBarEle.style.width = appState.sideBarWidth
    topicEle.textContent = appState.notes[appState.currentNoteId].topic ?? ""

    const list = Object.keys(appState.notes[appState.currentNoteId].cards).map(id => appState.notes[appState.currentNoteId].cards[id])
    for (let card of list) {
        updateOrCreateCard(card)
    }
}
initAll()


// ===============================================================================================================================================================
//                                     For Cards
// ===============================================================================================================================================================


// Create Card ================================================================

function genRandomGradient() {
    const hue1 = Math.floor(Math.random() * 360)
    const hue2 = hue1 + 15
    const hue3 = hue1 + 30
    const color1 = `hsla(${hue1},100%,50%,0.5)`
    const color2 = `hsla(${hue2},100%,50%,0.5)`
    const color3 = `hsla(${hue3},100%,50%,0.5)`
    const degree = Math.floor(Math.random() * 360)
    const gradientStr = `linear-gradient(${degree}deg,${color1},${color2},${color3})`
    return gradientStr
}

inputAreaEle.addEventListener("keypress", (e) => {
    if (e.code === "Enter" && e.shiftKey === false) {
        // console.log("用户按下Enter")
        e.preventDefault()
        const timestamp = Date.now()
        const inputContent = inputAreaEle.value

        inputAreaEle.value = ""

        const gradientStr = genRandomGradient()
        appState.notes[appState.currentNoteId].cards[timestamp] = { content: inputContent, created: timestamp, position: [0, 0], size: [60, 90], zIndex: 1, stylePosition: "static", bgc: gradientStr }

        writeToLocal()
        updateOrCreateCard(appState.notes[appState.currentNoteId].cards[timestamp])
    }
})

// Delete Card ================================================================
function deleteCard(id) {
    delete appState.notes[appState.currentNoteId].cards[id]
    let cardEle = document.querySelector(`[data-id="${id}"]`)
    cardEle.parentElement.removeChild(cardEle)
    writeToLocal()
}

addEventListener("mousedown", e => {
    if (e.button === 1 && e.target.matches(".miniCard")) {
        e.preventDefault()
        deleteCard(e.target.dataset.id)
    }
})

// Move Card ================================================================
function getMaxZIndex() {
    return Object.keys(appState.notes[appState.currentNoteId].cards).map(id => appState.notes[appState.currentNoteId].cards[id].zIndex).reduce((a, b) => Math.max(a, b), 1)
}

stageEle.addEventListener("mousedown", e => {
    e.preventDefault()
    if (e.target.className === "miniCard") {
        const timestamp = e.target.dataset.id
        const initClient = [e.clientX, e.clientY]
        const initPos = [e.target.offsetLeft, e.target.offsetTop]

        appState.notes[appState.currentNoteId].cards[timestamp].stylePosition = "absolute"
        appState.notes[appState.currentNoteId].cards[timestamp].zIndex = getMaxZIndex() + 1


        let lastE
        function startMove(e) {
            // document.documentElement.style.cursor = "grabbing"
            // e.target.style.cursor = "grabbing"

            lastE = e

            const currentClient = [e.clientX, e.clientY]
            const dx = currentClient[0] - initClient[0]
            const dy = currentClient[1] - initClient[1]
            appState.notes[appState.currentNoteId].cards[timestamp].position = [initPos[0] + dx, initPos[1] + dy]
            updateOrCreateCard(appState.notes[appState.currentNoteId].cards[timestamp])
            writeToLocal()

        }

        function cancelBind() {
            removeEventListener("mousemove", startMove)
            removeEventListener("mouseup", endMove)
        }

        function endMove() {
            if (lastE && lastE.clientX <= stageEle.clientWidth) {
                appState.notes[appState.currentNoteId].cards[timestamp].stylePosition = "static"
                e.target.style.position = "static"
            }
            // document.documentElement.style.cursor = "default"
            // e.target.style.cursor = "default"
            writeToLocal()
            cancelBind()
        }

        addEventListener("mousemove", startMove)
        addEventListener("mouseup", endMove)

        writeToLocal()
    }
})

// Double Click Card ================================================================
addEventListener("dblclick", e => {
    if (e.target.matches(".miniCard")) {
        e.preventDefault()
        console.log(e.target.dataset.id)
        const newValue = prompt("Please input new value", e.target.textContent).trim()
        if (newValue !== "") {
            e.target.textContent = appState.notes[appState.currentNoteId].cards[e.target.dataset.id].content = newValue
        }

        writeToLocal()
    }
})

// ===============================================================================================================================================================
//                                     For Topic
// ===============================================================================================================================================================


// Create Topic and Delete topic ================================================================
function createNewTopic() {
    const timestamp = Date.now()
    const topic = prompt("Please input this Topic")
    if (topic !== "") {
        if (!appState.notes) { appState.notes = {} }
        appState.notes[timestamp] = { topic: topic, cards: {}, id: timestamp }
        appState.currentNoteId = timestamp
        writeToLocal()
        initAll()
    }
}

function deleteCurrentTopic() {
    delete appState.notes[appState.currentNoteId]
    writeToLocal()
    initAll()
}

// Edit Topic ================================================================

function editCurrentTopic() {
    const topic = prompt("Please Edit this Topic", appState.notes[appState.currentNoteId].topic ?? "")
    topicEle.textContent = appState.notes[appState.currentNoteId].topic = topic
    writeToLocal()
    initAll()
}

// ↑↓ Switch Topic ================================================================

addEventListener("keyup", e => {
    if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        const keyList = Object.keys(appState.notes)
        if (e.code === "ArrowDown") { addDidff = +1 } else if (e.code === "ArrowUp") { addDidff = -1 }
        const nextIdx = (Number(keyList.length + keyList.indexOf(appState.currentNoteId)) + addDidff) % keyList.length
        appState.currentNoteId = keyList[nextIdx]
        writeToLocal()
        initAll()
        console.log(keyList.map(key => (key === keyList[nextIdx] ? "> " : "  ") + appState.notes[key].topic).join("\n"))
    }
})

// ===============================================================================================================================================================
//                                     For UI
// ===============================================================================================================================================================

// aside Width ================================================================

sideBarEle.addEventListener("mousemove", e => {
    if (e.clientX > sideBarEle.clientWidth * 0.9 && e.clientX < sideBarEle.clientWidth) {
        document.documentElement.style.cursor = "grab"
    } else {
        document.documentElement.style.cursor = "default"
    }
})
sideBarEle.addEventListener("mousedown", e => {
    if (e.target.matches("pre#stage")) {

        const initClientX = e.clientX
        const initWidth = sideBarEle.clientWidth


        function startAdjust(e) {
            dx = e.clientX - initClientX
            sideBarEle.style.width = appState.sideBarWidth = Math.min(Math.max(200, initWidth + dx), 1880)
            writeToLocal()
            document.documentElement.style.cursor = "move"
        }
        function cancelBind(e) {
            removeEventListener("mousemove", startAdjust)
            removeEventListener("mouseup", endAdjust)
        }

        function endAdjust(e) {
            document.documentElement.style.cursor = "default"
            cancelBind(e)
        }

        addEventListener("mousemove", startAdjust)
        addEventListener("mouseup", endAdjust)
    }

})

// Secret Mode ================================================================

function updateSecretModeView() {
    if (appState.secretMode) {
        document.documentElement.classList.add("secret-mode")

    } else {
        document.documentElement.classList.remove("secret-mode")
    }
}


function switchSecretMode() {
    appState.secretMode = !appState.secretMode
    updateSecretModeView()
    writeToLocal()

}


addEventListener("keypress", e => {
    if (e.code === "KeyS") switchSecretMode()
})

// Pure Mode ================================================================

function pureMode() {
    toolBarEle.style.display = "none"
    document.documentElement.requestFullscreen()

}

function completeMode() {
    toolBarEle.style.display = "block"
}

addEventListener("keyup", e => {
    if (e.code === "Escape") completeMode()
})


// ===============================================================================================================================================================
//                                     For Data
// ===============================================================================================================================================================

// Reset ================================================================
function currentToClipboard() {
    const text = Object.keys(appState.notes[appState.currentNoteId].cards).map(id => appState.notes[appState.currentNoteId].cards[id].content).join("\n")
    navigator.clipboard.writeText(text)
}

function exportAll() {
    const output = JSON.stringify(appState)
    navigator.clipboard.writeText(output)
}
function importAll() {
    const inputStr = prompt("Please input your Exported Data")
    if (inputStr.trim() !== "") {
        appState = JSON.parse(inputStr)
        writeToLocal()
        initAll()
    }
}

function resetAll() {
    const sureText = prompt("All data will be lost, input to make sure：DELETE ALL")
    if (sureText === "DELETE ALL") {
        appState = {}
        localStorage.clear()
        console.dir(appState)
        initAll()
    }
}