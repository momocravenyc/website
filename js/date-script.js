let element = document.querySelector(".status");
element.innerHTML = "Sorry, we're closed today, we will open back up tomorrow at 12 PM";

let notify_window = document.querySelector(".overlay-notify");

let elem = document.querySelector(".myButton");

elem.addEventListener("click",function(event){
    if(event.target.value === "Got it!") {
        element.style.display = "none";
        event.target.value = "Thank you!";
        elem.classList.add("hide-button");
        notify_window.style.display = "none";
    } 
    else {
        event.target.value = "Got it!";
        notify_window.style.display = "block";
    }
  },
  false
);

var date = new Date();
let weekDay = date.getDay();


if (weekDay==02){
    console.log("Today is Tuesday");
    notify_window.style.display = "block";
}else{
    console.log("Today is Not Tuesday");
    notify_window.style.display = "none";
}
    
