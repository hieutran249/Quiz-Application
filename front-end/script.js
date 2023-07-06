// TODO(you): Write the JavaScript necessary to complete the assignment.

const header = document.querySelector('header');
const attemptBtn = document.querySelector('#btn-start');
const submitBtn = document.querySelector('#btn-submit');
const tryAgainBtn = document.querySelector('#btn-try-again');
const introScreen = document.querySelector('#introduction');
const attemptScreen = document.querySelector('#attempt-quiz');
const reviewScreen = document.querySelector('#review-quiz');
const modal = document.querySelector('.modal');
const confirmBtn = modal.querySelector('#confirm-btn');
const cancelBtn = modal.querySelector('#cancel-btn');
const questionContainer = attemptScreen.querySelector('#question-container');
const reviewContainer = reviewScreen.querySelector('#review-container');
const score = reviewScreen.querySelector('#box__score');
const percent = reviewScreen.querySelector('#box__percent');
const feedback = reviewScreen.querySelector('#box__feedback');

const questionList = [];
const answers = { userAnswers: {} };
let attemptId;
let userAnswerList;
let correctAnswerList;
getQuiz();

// Handling screens
function attempQuiz() {
    // Hide Introduction and show Quiz
    introScreen.classList.toggle('hidden');
    attemptScreen.classList.toggle('hidden');
    header.scrollIntoView();
    populateQuestions(questionContainer, questionList);
    handleClickQuestion(questionContainer);
}

function finishQuiz() {
    // Hide Quiz and show Review
    reviewScreen.classList.toggle('hidden');
    attemptScreen.classList.toggle('hidden');
    header.scrollIntoView();
    closeModal();
    answerList();
    submitAnswers(answers, function () {
        checkAns();
    });
}

function tryAgainQuiz() {
    // Hide Review and show Introduction
    reviewScreen.classList.toggle('hidden');
    introScreen.classList.toggle('hidden');
    header.scrollIntoView();
}

function openModal() {
    modal.classList.add('open');
}

function closeModal() {
    modal.classList.remove('open');
}

attemptBtn.addEventListener('click', attempQuiz);
submitBtn.addEventListener('click', openModal);
tryAgainBtn.addEventListener('click', tryAgainQuiz);
confirmBtn.addEventListener('click', finishQuiz);
cancelBtn.addEventListener('click', closeModal);

// Fetching API to get quiz
function getQuiz() {
    fetch('https://wpr-quiz-api.herokuapp.com/attempts', { method: 'POST' })
        .then((response) => response.json())
        .then((data) => {
            data.questions.forEach((question) => {
                questionList.push(question);
            });
            attemptId = data._id;
        });
}

// Handling options
function handleClickQuestion(questionContainer) {
    const questionBoxes = questionContainer.querySelectorAll('.question-box');
    for (const box of questionBoxes) {
        const options = box.querySelectorAll('.option');
        for (const option of options) {
            option.addEventListener('click', function (e) {
                const selectedOption = box.querySelector('.option-selected');
                if (selectedOption)
                    selectedOption.classList.remove('option-selected');
                const chosenOption = e.currentTarget;
                chosenOption.classList.add('option-selected');
            });
        }
    }
}

// Create questions
function createQuestion(text, answers, index) {
    const question = document.createElement('div');
    question.classList.add('question-box');
    question.id = index;

    question.innerHTML = `
        <h2 class="question-index">Question ${index + 1} of 10</h2>
        <p class="question-text"></p>`;

    question.querySelector('p').textContent = text;

    answers.forEach(() => {
        question.innerHTML += `
            <label class="option">
                <input type="radio" name="answer${index}">
                <span></span>
            </label>`;
    });
    const answerEls = question.querySelectorAll('span');
    answerEls.forEach((ansEl, i) => {
        ansEl.textContent = answers[i];
    });
    return question;
}

// Populate questions
function populateQuestions(questionContainer, questions) {
    questions.forEach((question, index) => {
        questionContainer.appendChild(
            createQuestion(question.text, question.answers, index)
        );
    });
}

// Submiting answers
function submitAnswers(answers, callback) {
    fetch(`https://wpr-quiz-api.herokuapp.com/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
    })
        .then((res) => res.json())
        .then((data) => {
            userAnswerList = data.userAnswers;
            correctAnswerList = data.correctAnswers;
            score.textContent = data.score;
            percent.textContent = `${
                (data.score / questionList.length) * 100
            }%`;
            feedback.textContent = data.scoreText;
            callback();
        });
}

function answerList() {
    const questionBoxes = questionContainer.querySelectorAll('.question-box');
    for (const box of questionBoxes) {
        if (typeof selectedAnswer(box) === 'undefined') {
            continue;
        }
        const [id, indexAns] = selectedAnswer(box);
        answers.userAnswers[id] = String(indexAns);
    }
}

function selectedAnswer(questionBox) {
    const id = questionList[questionBox.getAttribute('id')]._id;
    const selectedAns = questionBox.querySelector('.option-selected');
    if (selectedAns) {
        const ansContent = selectedAns.querySelector('span').textContent;
        const indexAns = questionList[
            questionBox.getAttribute('id')
        ].answers.findIndex((ans) => {
            return ans === ansContent;
        });
        return [id, indexAns];
    }
}

function checkAns() {
    let i = 0;
    for (const [correctId, correctIndex] of Object.entries(correctAnswerList)) {
        for (const [questId, ansIndex] of Object.entries(userAnswerList)) {
            if (questId === correctId) {
                if (ansIndex === correctIndex) {
                    reviewContainer.appendChild(
                        chosenRightReview(
                            questionList[i].text,
                            questionList[i].answers,
                            i,
                            correctIndex
                        )
                    );
                    break;
                } else {
                    reviewContainer.appendChild(
                        chosenWrongReview(
                            questionList[i].text,
                            questionList[i].answers,
                            i,
                            correctIndex,
                            ansIndex
                        )
                    );
                    break;
                }
            }
        }
        reviewContainer.appendChild(
            notChosenReview(
                questionList[i].text,
                questionList[i].answers,
                i,
                correctIndex
            )
        );
        i++;
    }
}

// Create questions
function chosenRightReview(text, answers, index, correctIndex) {
    const review = document.createElement('div');
    review.classList.add('review-box');

    review.innerHTML = `
        <h2 class="question-index">Question ${index + 1} of 10</h2>
        <p class="question-text"></p>`;

    review.querySelector('p').textContent = text;

    answers.forEach(() => {
        review.innerHTML += `
            <label class="option">
                <input type="radio" name="answer${index}">
                <span></span>
            </label>`;
    });
    const answerEls = review.querySelectorAll('span');
    answerEls.forEach((ansEl, i) => {
        ansEl.textContent = answers[i];
        if (i === correctIndex) {
            ansEl.parentElement
                .querySelector('input')
                .setAttribute('checked', 'true');
            ansEl.parentElement.classList.add('correct-answer');
            ansEl.parentElement.innerHTML += `<span class="correct-ans-label">Correct answer</span>`;
        }
        ansEl.setAttribute('disabled', 'true');
    });

    return review;
}

function chosenWrongReview(text, answers, index, correctIndex, ansIndex) {
    const review = document.createElement('div');
    review.classList.add('review-box');

    review.innerHTML = `
        <h2 class="question-index">Question ${index + 1} of 10</h2>
        <p class="question-text"></p>`;

    review.querySelector('p').textContent = text;

    answers.forEach(() => {
        review.innerHTML += `
            <label class="option">
                <input type="radio" name="answer${index}">
                <span></span>
            </label>`;
    });
    const answerEls = review.querySelectorAll('span');
    answerEls.forEach((ansEl, i) => {
        ansEl.textContent = answers[i];
        if (i === correctIndex) {
            ansEl.parentElement.classList.add('option-correct');
            ansEl.parentElement.innerHTML += `<span class="correct-ans-label">Correct answer</span>`;
        }
        if (i === ansIndex) {
            ansEl.parentElement
                .querySelector('input')
                .setAttribute('checked', 'true');
            ansEl.parentElement.classList.add('wrong-answer');
            ansEl.parentElement.innerHTML += `<span class="your-ans-label">Your answer</span>`;
        }
        ansEl.setAttribute('disabled', 'true');
    });

    return review;
}

function notChosenReview(text, answers, index, correctIndex) {
    const review = document.createElement('div');
    review.classList.add('review-box');

    review.innerHTML = `
        <h2 class="question-index">Question ${index + 1} of 10</h2>
        <p class="question-text"></p>`;

    review.querySelector('p').textContent = text;

    answers.forEach(() => {
        review.innerHTML += `
            <label class="option">
                <input type="radio" name="answer${index}">
                <span></span>
            </label>`;
    });
    const answerEls = review.querySelectorAll('span');
    answerEls.forEach((ansEl, i) => {
        ansEl.textContent = answers[i];
        if (i === correctIndex) {
            ansEl.parentElement.classList.add('option-correct');
            ansEl.parentElement.innerHTML += `<span class="correct-ans-label">Correct answer</span>`;
        }
        ansEl.setAttribute('disabled', 'true');
    });

    return review;
}

// Populate questions
function populateReviews(reviewContainer, questions) {
    questions.forEach((question, index) => {
        questionContainer.appendChild(
            createQuestion(question.text, question.answers, index)
        );
    });
}
