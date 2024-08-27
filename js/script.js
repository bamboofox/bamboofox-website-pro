/** @format */

// 設置滾動事件監聽器
window.addEventListener("scroll", e => {
    document.body.style.setProperty("--scrollTop", `${window.scrollY}px`);
    // 如果滾動超過100vh
    if (window.scrollY > window.innerHeight) {
        document.body.classList.add("scrolled");
    } else {
        document.body.classList.remove("scrolled");
    }
});

// 設置鼠標移動事件監聽器
window.addEventListener("mousemove", e => {
    document.body.style.setProperty("--mouseX", `${e.clientX}px`);
    document.body.style.setProperty("--mouseY", `${e.clientY}px`);
    //console proerty transform for .layers_fox
    let fox = document.querySelector(".layers_middle");
    // get css
    let style = window.getComputedStyle(fox);
    // get css value
    let matrix = new WebKitCSSMatrix(style.transform);
    // get css value x
    let x = matrix.m41;
    // console.log(x);
});
let grantedOrientation = false;
// when mouse down ask for orientation permission
window.addEventListener("touchstart", e => {
    startShowingGyroData();
});

function startShowingGyroData() {
    if (grantedOrientation) return;
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        console.log("touchstart");
        DeviceOrientationEvent.requestPermission()
            .then(response => {
                if (response == "granted") {
                    window.addEventListener(
                        "deviceorientation",
                        handleOrientation
                    );
                    grantedOrientation = true;
                    console.log("granted");
                }else{
                    console.log("denied");
                }
            })
            .catch(console.error);
    } else {
        startColletButton.textContent = "裝置不支援";
    }
}

function handleOrientation(event) {
    // var absolute = event.absolute;
    // var alpha = event.alpha;
    // var beta = event.beta;
    var gamma = event.gamma;

    // Do stuff with the new orientation data
    document.body.style.setProperty("--mouseX", `${gamma * 10}deg`);
}
