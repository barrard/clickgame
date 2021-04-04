//functions which tell us about the time of the world  i.e. is market open or close? pre-market? is it a weekend?  how long till market opens

module.exports = {
    timeEST,
    marketIsClosing,
    marketIsOpening,
    isMorning,
    isEvening,
    isWeekend,
    isOpen,
};

function isOpen() {
    let weekend = isWeekend();
    if (weekend) return false;
    let time = timeEST();
    let hour = new Date(time).getHours();
    let min = new Date(time).getMinutes();
    if (hour === 9) {
        if (min >= 30) {
            return true;
        }
        //3:55 is the market closing time
    } else if (hour > 9 && hour < 16) {
        if (hour === 15 && min > 55) {
            return false;
        }
        return true;
    } else return false;
}

function timeEST(date) {
    date = date || new Date();
    // return new Date(date);
    return new Date(date).toLocaleString("en-US", { timeZone: "America/New_York" });
}

function marketIsClosing() {
    let time = timeEST();
    let hour = new Date(time).getHours();
    let min = new Date(time).getMinutes();
    // return true;
    if (hour === 15 && min > 55) {
        console.log(`MARKET IS CLOSING : ${timeEST()}`);
        return true;
    } else return false;
}

let count = 0;
function marketIsOpening() {
    count++;
    let time = timeEST();
    let hour = new Date(time).getHours();
    let min = new Date(time).getMinutes();

    if (count % 100 === 0) {
        console.log({ time, hour, min });
    }
    if (hour === 9 && min >= 29) {
        console.log(`Market is opening ${timeEST()}`);
        return true;
    } else return false;
}

function isMorning() {
    let time = timeEST();
    let hour = new Date(time).getHours();
    let min = new Date(time).getMinutes();

    if (hour < 9) {
        return true;
    } else if (hour === 9 && min <= 28) {
        return true;
    } else return false;
}

function isEvening() {
    let time = timeEST();
    let hour = new Date(time).getHours();
    let min = new Date(time).getMinutes();

    if (hour >= 16) {
        return true;
    } else return false;
}

function isWeekend() {
    let time = timeEST();
    let day = new Date(time).getDay();

    if (day === 0 || day === 6) {
        return true;
    } else return false;
}
