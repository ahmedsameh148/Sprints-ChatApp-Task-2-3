const Pusher = require('pusher');
const Express = require('express');
const cors = require('cors');
var bodyParser = require('body-parser')

const pusher = new Pusher({
    appId: "1259116",
    key: "bdfbe0e53ab81f71293a",
    secret: "92ba1162e4ecfbfab9f7",
    cluster: "eu",
    useTLS: true
});

const app = Express();
let numberOfChannelMembers = new Map();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());

app.listen(8000, () => {
    console.log('Listen At Port 8000');
});

app.post('/message', async (req, res) => {
     
    await pusher.trigger(`${req.body.ChannelName}`, "sendMessage", {
        message: req.body.Message,
        senderID : req.body.senderID,
        senderName : req.body.senderName
    });
    res.status(200).send({msg : "Message Sent Successfully"});
});

app.post('/addNewMember', async (req, res) => {
    let num = 0;

    if(numberOfChannelMembers.has(req.body.channelName))
        num = numberOfChannelMembers.get(req.body.channelName);
    numberOfChannelMembers.set(req.body.channelName, num + 1);

    await pusher.trigger(`${req.body.channelName}`, "membersUpdated", {
        numberOfMembers: num + 1,
    });

    res.status(200).send({msg : "Updated Successfully"});
});

app.post('/removeMember', async (req, res) => {

    let num = numberOfChannelMembers.get(req.body.channelName);
    numberOfChannelMembers.set(req.body.channelName, num - 1);
    await pusher.trigger(`${req.body.channelName}`, "membersUpdated", {
        numberOfMembers: num - 1,
    }); 
    res.status(200).send({msg : "Updated Successfully"});
});