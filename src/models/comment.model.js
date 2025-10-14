const mongoose = require('mongoose');
const mongooseAggregatePaginate = require('mongoose-aggregate-paginate-v2');


const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"   
    },
    Owner: {
        type: Schema.Types.ObjectId,
        ref: "User"   
    },
},{
    timestamps: true
})

videoSchema.plugin(mongooseAggregatePaginate);
const Comment = mongoose.model('Comment',commentSchema);
module.exports = Comment;