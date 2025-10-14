const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.objectId,
        ref: "User"
    }
},
{
    timestamps: true
}
)
const Tweet = mongoose.model('Tweet',tweetSchema);
module.exports = Tweet;