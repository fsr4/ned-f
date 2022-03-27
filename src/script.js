document.addEventListener("DOMContentLoaded", init);
document.addEventListener("keypress", keyEvent => {
    if (keyEvent.key === "Enter") confirm();
});

let websocket;
let body;
let currentKey;
let keyInput;
let popup;

function init() {
    body = document.querySelector("body");

    keyInput = document.querySelector("input#key");
    keyInput.addEventListener("change", sendMatrikelKey);
    keyInput.addEventListener("blur", () => setTimeout(() => {
        keyInput.focus();
    }, 1));
    keyInput.focus();

    popup = document.querySelector("p#popup");

    // Setup websocket
    websocket = new WebSocket("ws://localhost:5001");
    websocket.addEventListener("message", message => {
        const data = JSON.parse(message.data);
        console.log("message received: ", data);

        switch (data.type) {
            case "keyDetected":
                keyDetected(data.key, data.exists);
                break;
        }
    });
}

function sendMatrikelKey(inputEvent) {
    const value = inputEvent.target.value;
    if (!value.match(/^[0-9]{6}$/g)) {
        if (value === "") return;
        keyInput.classList.add("error-border");
        setTimeout(() => keyInput.classList.remove("error-border"), 1000);
        return;
    }
    console.log("value entered: ", value);
    websocket.send(JSON.stringify({
        type: "keyDetected",
        key: value
    }));
}

function keyDetected(key, exists) {
    if (exists) {
        body.classList.add("error");
    } else {
        body.classList.add("success");
        currentKey = key;
    }

    popup.hidden = false;
}

function confirm() {
    popup.hidden = true;
    if (!body.classList.contains("success") && !body.classList.contains("error")) return;
    body.classList.remove("success", "error");
    keyInput.value = "";
    if (!currentKey) return;
    websocket.send(JSON.stringify({
        type: "saveKey",
        key: currentKey
    }));
    currentKey = undefined;
}
