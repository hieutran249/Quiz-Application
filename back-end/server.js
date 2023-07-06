const express = require('express');
const app = express();
const mongodb = require('mongodb');

// serve static files (html, css, js, images...)
app.use(express.static('public'));

// decode req.body from form-data
app.use(express.urlencoded({ extended: true }));
// decode req.body from post body message
app.use(express.json());

app.get('/', (req, res) => {
    res.render(index);
});

app.post('/attempts', async function (req, res) {
    const docs = await questionColl
        .aggregate([{ $sample: { size: 10 } }])
        .toArray();
    docs.forEach((doc) => {
        delete doc.__v;
    });
    await attemptsColl.insertOne({
        questions: docs,
        startAt: new Date(),
        completed: false,
    });
    const [data] = await attemptsColl
        .find({})
        .sort({ _id: -1 })
        .limit(1)
        .toArray();
    data.questions.forEach((question) => {
        delete question.correctAnswer;
    });
    res.status(201).send(data);
});

app.post('/attempts/:id/submit', async function (req, res) {
    const attemptId = req.params.id;
    const userAnswers = req.body.userAnswers;
    const correctAnswers = {};
    let score = 0;
    let scoreText;

    const [attempt] = await attemptsColl
        .find({
            _id: mongodb.ObjectId(`${attemptId}`),
        })
        .toArray();
    attempt.questions.forEach((question) => {
        correctAnswers[question._id] = question.correctAnswer;
    });

    for (const userAns of Object.keys(userAnswers)) {
        for (const correctAns of Object.keys(correctAnswers)) {
            if (userAns === correctAns) {
                if (
                    Number(userAnswers[userAns]) ===
                    Number(correctAnswers[correctAns])
                ) {
                    score++;
                    break;
                }
            }
        }
    }
    if (score < 5) scoreText = 'Practice more to improve it :D';
    else if (score < 7) scoreText = 'Good, keep up!';
    else if (score < 9) scoreText = 'Well done!';
    else scoreText = 'Perfect!!';

    attempt.correctAnswers = correctAnswers;
    attempt.completed = true;
    attempt.userAnswers = userAnswers;
    attempt.score = score;
    attempt.scoreText = scoreText;
    res.status(200).send(attempt);
});

const DATABASE_NAME = 'wpr_quiz';
const MONGO_URL = `mongodb://localhost:27017/${DATABASE_NAME}`;
let db = null;
let questionColl = null;
let attemptsColl = null;
async function startServer() {
    // Set the db and collection variables before starting the server.
    const client = await mongodb.MongoClient.connect(MONGO_URL);
    db = client.db(DATABASE_NAME);
    console.log('connected to the server');
    questionColl = db.collection('questions');
    attemptsColl = db.collection('attempts');
    // Now every route can safely use the db and collection objects.
    // db != null -> start server
    app.listen(3000, function () {
        console.log('Listening on port 3000!');
    });
}
startServer();
