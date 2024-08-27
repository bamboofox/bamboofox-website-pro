/** @format */
const awards = document.querySelector(".awards");
// 設置滾動事件監聽器
window.addEventListener("scroll", e => {
    document.body.style.setProperty("--scrollTop", `${window.scrollY}px`);
    // 如果滾動超過100vh
    if (window.scrollY > window.innerHeight) {
        document.body.classList.add("scrolled");
        var a =
            ((window.scrollY - window.innerHeight - window.innerWidth / 2) /
                window.innerWidth) *
            2;
        awards.style.setProperty("--opacity", Math.max(0, Math.min(1, a)));

        // if scrolled to the bottom, add class .fixed to footer, scroll to top, and add .vanish to footer. After 1s, remove .fixed and .vanish
        if (
            window.scrollY + window.innerHeight + 2>=
            document.documentElement.scrollHeight
        ) {
            document.body.style.overflow = "hidden";
            document.querySelector("footer").classList.add("fixed");
            window.scrollTo(0, 0);
            setTimeout(() => {
                document.querySelector("footer").classList.add("vanished");
                setTimeout(() => {
                    document.querySelector("footer").classList.remove("fixed");
                    document
                        .querySelector("footer")
                        .classList.remove("vanished");
                    document.body.style.overflow = "auto";
                }, 1000);
            }, 500);
        }
    } else {
        document.body.classList.remove("scrolled");
    }
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
