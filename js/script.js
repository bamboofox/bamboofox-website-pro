/** @format */
const award_container = document.querySelector(".awards_container");
// 設置滾動事件監聽器
window.addEventListener("scroll", e => {
    document.body.style.setProperty("--scrollTop", `${window.scrollY}px`);
    // 如果滾動超過100vh
    if (window.scrollY > window.innerHeight) {
        document.body.classList.add("scrolled");
        var a =
            (window.scrollY - window.innerHeight - window.innerWidth / 2) /
            window.innerWidth *200;
        award_container.style.opacity = Math.max(0, Math.min(100, a)) +"%";
    } else {
        document.body.classList.remove("scrolled");
    }

    // get CSS transform for .awards_container
});

// 設置鼠標移動事件監聽器
window.addEventListener("mousemove", e => {
    document.body.style.setProperty("--mouseX", `${e.clientX}px`);
    document.body.style.setProperty("--mouseY", `${e.clientY}px`);
});
let grantedOrientation = false;

// window.addEventListener("touchstart", e => {
//     if (grantedOrientation) return;
//     startShowingGyroData();
// });

// function startShowingGyroData() {
//     if (typeof DeviceOrientationEvent.requestPermission === "function") {
//         console.log("touchstart");
//         DeviceOrientationEvent.requestPermission()
//             .then(response => {
//                 if (response == "granted") {
//                     window.addEventListener(
//                         "deviceorientation",
//                         handleOrientation
//                     );
//                     grantedOrientation = true;
//                     console.log("granted");
//                 } else {
//                     console.log("denied");
//                 }
//             })
//             .catch(console.error);
//     } else {
//         console.log("no requestPermission");
//     }
// }

// function handleOrientation(event) {
//     // var absolute = event.absolute;
//     // var alpha = event.alpha;
//     // var beta = event.beta;
//     var gamma = event.gamma;

//     // Do stuff with the new orientation data
//     document.body.style.setProperty("--mouseX", `${gamma * 10}deg`);
// }
