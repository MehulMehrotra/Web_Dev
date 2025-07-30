let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;

const timeDisplay = document.getElementById("time");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const lapBtn = document.getElementById("lap");
const lapsList = document.getElementById("laps");

function timeToString(time) {
  let ms = time % 1000;
  let totalSeconds = Math.floor(time / 1000);
  let seconds = totalSeconds % 60;
  let minutes = Math.floor(totalSeconds / 60) % 60;
  let hours = Math.floor(totalSeconds / 3600);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${padMs(ms)}`;
}

function pad(number) {
  return number.toString().padStart(2, '0');
}

function padMs(ms) {
  return ms.toString().padStart(3, '0').slice(0, 2); // Only show 2 ms digits
}

function startTimer() {
  if (!isRunning) {
    isRunning = true;
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(() => {
      elapsedTime = Date.now() - startTime;
      timeDisplay.textContent = timeToString(elapsedTime);
    }, 10);
  }
}

function pauseTimer() {
  isRunning = false;
  clearInterval(timerInterval);
}

function resetTimer() {
  pauseTimer();
  elapsedTime = 0;
  timeDisplay.textContent = "00:00:00.00";
  lapsList.innerHTML = "";
}

function recordLap() {
  if (isRunning) {
    const lapTime = timeToString(elapsedTime);
    const li = document.createElement("li");
    li.textContent = `Lap ${lapsList.children.length + 1}: ${lapTime}`;
    lapsList.appendChild(li);
  }
}

startBtn.addEventListener("click", startTimer);
pauseBtn.addEventListener("click", pauseTimer);
resetBtn.addEventListener("click", resetTimer);
lapBtn.addEventListener("click", recordLap);
