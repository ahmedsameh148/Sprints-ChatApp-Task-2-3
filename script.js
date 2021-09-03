'use strict';

var interval;
let ele = document.getElementById('message');
ele.addEventListener('keydown', function(e) {
    const keyCode = e.which || e.keyCode;
    if(keyCode === 13 && !e.altKey){
        Send();
    }
    else if (keyCode === 13 && e.altKey) {
        ele.value = ele.value + ". ";
    }
});
const strIsValid = function(str){
    let letterCounter = 0;
    for(let i = 0; i < str.length; i++){
        if(str[i].toLowerCase() != str[i].toUpperCase())
            letterCounter += 1;
    }
    return letterCounter === str.length;
}
let CurrentUser = {
    GroupName : '',
    UserName : '',
    Channel : '',
    ID : ''
};
const pusher = new Pusher('bdfbe0e53ab81f71293a', {
    cluster: 'eu'
});
const updateRequiedComponentsAfterLogin = async function(){
    
    document.querySelector('#loginForm').style.display = 'none';
    document.querySelector('#chatForm').style.display = 'block';
    document.querySelector('#welcomeMessage').textContent = `Welcome ${CurrentUser.UserName}`;
}
const renderNewMessage = function(data){
    let msg = data.message;
    let senderID = data.senderID;
    let senderName = data.senderName;
    const row = `
        <span style="text-align: ${(senderID === CurrentUser.ID) ? 'right' : 'left'};">
            <p> ${(senderID === CurrentUser.ID) ? 'You' : senderName}: ${msg}</p>
        </span>`;
    document.querySelector('#messagesContainer').insertAdjacentHTML("beforeEnd", row);
    document.querySelector('#message').value = "";
}
const initPusherAndEvents = function(){

    CurrentUser.Channel = pusher.subscribe(`${CurrentUser.GroupName}`);
    CurrentUser.Channel.bind('sendMessage', (data) => {
        renderNewMessage(data);
    });
    CurrentUser.Channel.bind('membersUpdated', (data) => {
        document.querySelector('#chatHeader').textContent = "";
        document.querySelector('#chatHeader').textContent = `${CurrentUser.GroupName} : Online Users (${data.numberOfMembers})`;
    });
}
const updateUserObj = function(GroupName, UserName){
    CurrentUser.GroupName = GroupName;
    CurrentUser.UserName = UserName;
    CurrentUser.ID = Date.now();
}
const addNewMember = async function(){
    const reqBody = {
        "channelName" : CurrentUser.GroupName
    };
    const response = await fetch('http://localhost:8000/addNewMember', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(reqBody),
    });
}
const removeMember = async function(){
    const reqBody = {
        "channelName" : CurrentUser.GroupName
    };
    const response = await fetch('http://localhost:8000/removeMember', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(reqBody),
    });
}
const Login = function(){
    const GroupName = document.querySelector('#groupName').value.toUpperCase();
    const UserName = document.querySelector('#userName').value;
    if(!strIsValid(GroupName) || !strIsValid(UserName)){
        alert('Please Enter Group Name And Username With Only Alphabets');
        return;
    }
    updateUserObj(GroupName, UserName);
    alert(`You Logged in With Group Name ${GroupName} And Username ${UserName}`);

    initPusherAndEvents();
    updateRequiedComponentsAfterLogin();
    addNewMember();
    setCountDown();
    localStorage.setItem("userID", CurrentUser.ID);
}
const Logout = function(isForcedLogout = false){
    if(!isForcedLogout && !confirm('Are You Sure You Want To Logout?'))
        return;
    pusher.unsubscribe(`${CurrentUser.GroupName}`);
    removeMember();
    CurrentUser.UserName = '';
    CurrentUser.GroupName = '';
    document.querySelector('#loginForm').style.display = 'block';
    document.querySelector('#chatForm').style.display = 'none';
    clearInterval(interval);
    localStorage.removeItem("userID");
}
const Send = async function(){
    let msg = document.querySelector('#message').value;
    if(!strIsValid(msg)){
        alert("The Message Is Empty");
        return;
    }
    let res = "";
    for(let i = 0; i < msg.length; i++){
        if(msg[i] === '.')
            res += '<br/>';
        else res += msg[i];
    }
    msg = res;
    const reqBody = {
        "Message" : msg,
        "senderID" : CurrentUser.ID,
        "senderName" : CurrentUser.UserName,
        "ChannelName" : CurrentUser.GroupName
    };
    const response = await fetch('http://localhost:8000/message', {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json'
        },
        body : JSON.stringify(reqBody),
    });
    clearInterval(interval);
    setCountDown();
}
const setCountDown = function(){
    var counter = 60;
    interval = setInterval(() => {
        document.querySelector('#countDown').textContent = `You Will Logged out Automaticlly After ${counter} Seconds`;
        counter -= 1;
        if(counter < 0){
            Logout(true);
            clearInterval(interval);
        }
    }, 1000);
}