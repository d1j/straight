const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const faker = require("faker");

mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new Schema({
    name: { type: String },
    surname: { type: String },
    phone: { type: String },
    email: { type: String },
    address: { type: String },
    age: { type: Number }
});
const User = mongoose.model("User", UserSchema);
const CommentSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    text: { type: String },
    likes: { type: Number }
});
const PostSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: { type: String },
    content: { type: String },
    likes: { type: Number },
    comments: [CommentSchema]
});

const Post = mongoose.model("Post", PostSchema);

async function generateData() {
    let numberOfUsers = 10;
    let maxNumOfPosts = 5;
    let maxNumOfComments = 5;
    let userIDs = [];
    for (let i = 0; i < numberOfUsers; i++) {
        let userData = {
            name: faker.name.firstName(),
            surname: faker.name.lastName(),
            age: Math.floor(Math.random() * 50) + 20 // 20-69 metai.
        };
        const newUser = new User(userData);
        userIDs.push((await newUser.save())._id);
    }
    for (let i = 0; i < numberOfUsers; i++) {
        let num_of_posts = Math.floor(Math.random() * maxNumOfPosts);
        for (let j = 0; j < num_of_posts; j++) {
            let num_of_comments = Math.floor(Math.random() * maxNumOfComments);
            let allComments = [];
            for (let k = 0; k < num_of_comments; k++) {
                let commentData = {
                    user: userIDs[Math.floor(Math.random() * numberOfUsers)],
                    text: faker.lorem.sentence(),
                    likes: Math.floor(Math.random() * 50)
                };
                allComments.push(commentData);
            }
            let postData = {
                user: userIDs[i],
                title: faker.lorem.sentence(Math.floor(Math.random() * 5) + 1),
                content: faker.lorem.paragraph(),
                likes: Math.floor(Math.random() * 100),
                comments: allComments
            };
            const newPost = new Post(postData);
            await newPost.save();
        }
    }
}

async function processData() {
    try {
        let o = {
            map: "function () { emit(this.user, this.likes) }",
            reduce: "function (key, values) { return Array.sum(values) }"
        };
        let likes = (await Post.mapReduce(o)).results;
        likes.sort(function (a, b) { return a.value - b.value; });
    } catch (err) {
        throw err;
    }
}