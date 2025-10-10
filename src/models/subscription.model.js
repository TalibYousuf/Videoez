const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    subscriber :{
        type: Schema.Types.ObjectId, //one who is subscribing
        ref: "User"
    },
    channel: {
        type: Schema.Types.ObjectId, //one who's channel is subscribed
        ref: "User"
    }
},
{
    timestamps: true
}
)

const Subscription = mongoose.model('Subscription',subscriptionSchema);
module.exports = Subscription;