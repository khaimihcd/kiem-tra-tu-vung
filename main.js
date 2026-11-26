// =====================================
// 1. LẤY CÁC PHẦN TỬ HTML
// =====================================

const topicScreen = document.getElementById("topicScreen");
const learningScreen = document.getElementById("learningScreen");
const finishScreen = document.getElementById("finishScreen");

const topicList = document.getElementById("topicList");
const startButton = document.getElementById("startButton");

const meaning = document.getElementById("meaning");
const phonetic = document.getElementById("phonetic");
const type = document.getElementById("type");

const answer = document.getElementById("answer");
const message = document.getElementById("message");

const correct = document.getElementById("correct");
const wrong = document.getElementById("wrong");

const progress = document.getElementById("progress");

const restart = document.getElementById("restart");
const backButton = document.getElementById("backButton");

const retryButton = document.getElementById("retryButton");
const topicButton = document.getElementById("topicButton");

const finalCorrect = document.getElementById("finalCorrect");
const finalWrong = document.getElementById("finalWrong");

const wrongList = document.getElementById("wrongList");

const retryWrongButton = document.getElementById("retryWrongButton");

const hint = document.getElementById("hint");

// =====================================
// 2. ĐỌC TỪ VỰNG TIẾNG ANH
// =====================================

function speakEnglish(word) {
  if (!("speechSynthesis" in window)) {
    console.log("Trình duyệt không hỗ trợ đọc giọng nói");
    return;
  }

  // Dừng giọng đọc trước đó
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(word);

  speech.lang = "en-US";
  speech.rate = 0.9;
  speech.volume = 1;
  speech.pitch = 1;

  const voices = window.speechSynthesis.getVoices();

  const googleVoice = voices.find(function (voice) {
    return voice.name.includes("Google") && voice.lang.startsWith("en");
  });

  const englishVoice =
    googleVoice ||
    voices.find(function (voice) {
      return voice.lang.startsWith("en");
    });

  if (englishVoice) {
    speech.voice = englishVoice;
  }

  window.speechSynthesis.speak(speech);
}

function createSpeakerButton() {
  // Không tạo nhiều nút loa
  if (document.getElementById("speakerButton")) {
    return;
  }

  const speakerButton = document.createElement("button");

  speakerButton.id = "speakerButton";
  speakerButton.type = "button";
  speakerButton.textContent = "🔊";
  speakerButton.title = "Nghe phát âm";
  speakerButton.setAttribute("aria-label", "Nghe phát âm");

  speakerButton.style.cssText = `
        border: none;
        background: transparent;
        cursor: pointer;
        font-size: 22px;
        margin-left: 10px;
        vertical-align: middle;
    `;

  speakerButton.addEventListener("click", function () {
    if (currentWord) {
      speakEnglish(currentWord.english);
    }
  });

  phonetic.insertAdjacentElement("afterend", speakerButton);
}

// =====================================
// 3. KHAI BÁO BIẾN
// =====================================

let selectedTopics = [];

let currentVocabulary = [];
let currentIndex = 0;
let currentWord = null;

let correctCount = 0;
let wrongCount = 0;

let wrongWords = [];

let hintCount = 0;

// =====================================
// 4. HIỂN THỊ GỢI Ý
// =====================================

function showHint() {
  const word = currentWord.english.toUpperCase();

  let revealed = 0;

  const hintText = [...word]
    .map(function (char) {
      if (char === " ") {
        return " ";
      }

      if (revealed < hintCount) {
        revealed++;
        return char;
      }

      return "_";
    })
    .join("");

  hint.textContent = "Gợi ý: " + hintText;
}

// =====================================
// 5. HIỂN THỊ DANH SÁCH CHỦ ĐỀ
// =====================================

function renderTopics() {
  topicList.innerHTML = "";

  topics.forEach(function (topic) {
    const topicCard = document.createElement("label");

    topicCard.className = "topic";

    topicCard.innerHTML = `
            <input
                type="checkbox"
                value="${topic.id}"
            >

            <h3>${topic.icon} ${topic.name}</h3>

            <p>${topic.englishName}</p>
        `;

    const checkbox = topicCard.querySelector("input");

    checkbox.addEventListener("change", function () {
      topicCard.classList.toggle("selected", checkbox.checked);
    });

    topicList.appendChild(topicCard);
  });
}

// =====================================
// 6. BẮT ĐẦU HỌC
// =====================================

startButton.addEventListener("click", function () {
  const checkedTopics = topicList.querySelectorAll("input:checked");

  selectedTopics = Array.from(checkedTopics).map(function (item) {
    return item.value;
  });

  if (selectedTopics.length === 0) {
    alert("Vui lòng chọn ít nhất một chủ đề!");
    return;
  }

  currentVocabulary = [];

  selectedTopics.forEach(function (topicId) {
    const words = vocabularyDatabase[topicId];

    if (words) {
      currentVocabulary.push(...words);
    }
  });

  resetGame();

  topicScreen.classList.add("hidden");
  finishScreen.classList.add("hidden");
  learningScreen.classList.remove("hidden");

  showWord();
});

// =====================================
// 7. HIỂN THỊ TỪ VỰNG
// =====================================

function showWord() {
  currentWord = currentVocabulary[currentIndex];

  meaning.textContent = currentWord.vietnamese;
  phonetic.textContent = currentWord.phonetic;
  type.textContent = currentWord.type;

  answer.value = "";
  answer.focus();

  progress.textContent = `Từ ${currentIndex + 1} / ${currentVocabulary.length}`;

  hintCount = 0;

  hint.textContent = "";
  message.textContent = "";

  // Tự động đọc từ tiếng Anh khi từ xuất hiện
  speakEnglish(currentWord.english);
}

// =====================================
// 8. CẬP NHẬT ĐIỂM
// =====================================

function updateScore() {
  correct.textContent = correctCount;

  wrong.textContent = wrongCount;
}

// =====================================
// 9. KIỂM TRA ĐÁP ÁN
// =====================================

answer.addEventListener("keydown", function (event) {
  if (event.key !== "Enter") return;

  event.preventDefault();

  const userAnswer = answer.value.trim().toLowerCase();

  if (userAnswer === "") {
    message.textContent = "Vui lòng nhập đáp án!";
    return;
  }

  // TRƯỜNG HỢP TRẢ LỜI ĐÚNG
  if (userAnswer === currentWord.english.toLowerCase()) {
    const alreadyWrong = wrongWords.some(function (item) {
      return item.word === currentWord;
    });

    // Chỉ cộng điểm nếu chưa từng trả lời sai
    if (!alreadyWrong) {
      correctCount++;
    }

    message.textContent = "Chính xác!";
    message.style.color = "green";

    updateScore();

    currentIndex++;
    hintCount = 0;

    if (currentIndex < currentVocabulary.length) {
      showWord();
    } else {
      showResult();
    }
  } else {
    // TRƯỜNG HỢP TRẢ LỜI SAI

    const alreadyWrong = wrongWords.some(function (item) {
      return item.word === currentWord;
    });

    // Một từ chỉ được tính sai một lần
    if (!alreadyWrong) {
      wrongCount++;

      wrongWords.push({
        word: currentWord,
        userAnswer: userAnswer,
      });
    }

    hintCount++;

    const wordLength = [...currentWord.english].filter(function (char) {
      return char !== " ";
    }).length;

    hintCount = Math.min(hintCount, wordLength);

    message.textContent = "Chưa chính xác! Hãy thử lại.";

    message.style.color = "red";

    showHint();

    updateScore();

    answer.value = "";
    answer.focus();
  }
});

// =====================================
// 10. HIỂN THỊ DANH SÁCH TỪ SAI
// =====================================

function renderWrongWords() {
  wrongList.innerHTML = "";

  if (wrongWords.length === 0) {
    const successMessage = document.createElement("div");

    successMessage.className = "no-wrong";

    successMessage.textContent = "🎉 Tuyệt vời! Bạn không trả lời sai từ nào.";

    wrongList.appendChild(successMessage);

    retryWrongButton.style.display = "none";

    return;
  }

  retryWrongButton.style.display = "inline-block";

  wrongWords.forEach(function (item, index) {
    const word = item.word;

    const wordCard = document.createElement("div");

    wordCard.className = "wrong-item";

    const title = document.createElement("h3");

    title.textContent = `${index + 1}. ${word.vietnamese}`;

    const phoneticText = document.createElement("p");

    phoneticText.textContent = "Phiên âm: " + word.phonetic;

    const typeText = document.createElement("p");

    typeText.textContent = "Loại từ: " + word.type;

    const userAnswerText = document.createElement("p");

    userAnswerText.textContent = "Bạn đã nhập: " + item.userAnswer;

    const correctAnswerText = document.createElement("p");

    correctAnswerText.className = "correct-answer";

    correctAnswerText.textContent = "Đáp án đúng: " + word.english;

    wordCard.appendChild(title);
    wordCard.appendChild(phoneticText);
    wordCard.appendChild(typeText);
    wordCard.appendChild(userAnswerText);
    wordCard.appendChild(correctAnswerText);

    wrongList.appendChild(wordCard);
  });
}

// =====================================
// 11. HIỂN THỊ KẾT QUẢ
// =====================================

function showResult() {
  learningScreen.classList.add("hidden");

  finishScreen.classList.remove("hidden");

  finalCorrect.textContent = correctCount;

  finalWrong.textContent = wrongCount;

  renderWrongWords();
}

// =====================================
// 12. RESET CHƯƠNG TRÌNH
// =====================================

function resetGame() {
  currentIndex = 0;

  correctCount = 0;

  wrongCount = 0;

  wrongWords = [];

  answer.disabled = false;

  message.textContent = "";

  message.className = "";

  updateScore();
}

// =====================================
// 13. HỌC LẠI
// =====================================

restart.addEventListener("click", function () {
  resetGame();

  showWord();
});

retryButton.addEventListener("click", function () {
  resetGame();

  finishScreen.classList.add("hidden");

  learningScreen.classList.remove("hidden");

  showWord();
});

// =====================================
// 14. HỌC LẠI NHỮNG TỪ ĐÃ SAI
// =====================================

retryWrongButton.addEventListener("click", function () {
  currentVocabulary = wrongWords.map(function (item) {
    return item.word;
  });

  resetGame();

  finishScreen.classList.add("hidden");

  learningScreen.classList.remove("hidden");

  showWord();
});

// =====================================
// 15. QUAY LẠI CHỌN CHỦ ĐỀ
// =====================================

function goToTopics() {
  learningScreen.classList.add("hidden");

  finishScreen.classList.add("hidden");

  topicScreen.classList.remove("hidden");

  resetGame();
}

backButton.addEventListener("click", goToTopics);

topicButton.addEventListener("click", goToTopics);

// =====================================
// 16. KHỞI CHẠY WEBSITE
// =====================================
createSpeakerButton();
renderTopics();
