window.onload = function () {
    var hichat = new HiChat();
    hichat.init();
};

var HiChat = function () {
    this.socket = null;
};

HiChat.prototype = {
    init: function () {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect', function () {
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
            
        });
        this.socket.on('nickExisted', function () {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls';
        });
        this.socket.on('loginSuccess', function () {
            // var password = document.getElementById('pwdInput').value;
            // if(password=="!Lov3myChat"){
            document.title = 'MyChat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
            // }else{
            //     console.log("Password is wrong!"+password);
            //     window.alert("Incorrect password!Please contact to admin.");
            // }
        });
        this.socket.on('error', function (err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = '!fail to connect :(';
            } else {
                document.getElementById('info').textContent = '!fail to connect :(';
            }
        });
        this.socket.on('system', function (nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' joined' : ' left');




            that._displayNewMsg('system ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';

        });

        this.socket.on('newMsg', function (user, msg, color) {
            if (window.Notification && Notification.permission !== "denied") {

                Notification.requestPermission(function (status) {  // status is "granted", if accepted by user
                    var n = new Notification(`New message from ${user}`, { body: msg, icon: './content/happy.png' });
                    setTimeout(function () { n.close() }, 2000);
                });

            }
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newImg', function (user, img, color) {
            that._displayImage(user, img, color);
        });
        document.getElementById('loginBtn').addEventListener('click', function () {
            var nickName = document.getElementById('nicknameInput').value;
            // window.options={
            //     body:nickName,
            //     icon:'./content/happy.png' 

            // }
            if (nickName.trim().length != 0) {
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function (e) {
            if (e.keyCode == 13 ) {
                var nickName = document.getElementById('nicknameInput').value;
                
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                };
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function () {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,

                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                that.socket.emit('postMsg', msg, color);
                // console.log("Message",msg);
                that._displayNewMsg('me', msg, color);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function (e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
                // console.log("new message");

            };
        }, false);
        
        document.getElementById('clearBtn').addEventListener('click', function () {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('sendImage').addEventListener('change', function () {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if (!reader) {
                    that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function (e) {
                    this.value = '';
                    that.socket.emit('img', e.target.result, color);
                    that._displayImage('me', e.target.result, color);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function (e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function (e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function (e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function () {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        // added smiley emoji's//
        docFragment1 = document.createDocumentFragment();
        for (var j = 110; j > 69; j--) {
            var emojiItem1 = document.createElement('img');
            emojiItem1.src = '../content/emoji/' + j + '.png';
            emojiItem1.title = j;
            docFragment1.appendChild(emojiItem1);
        };
        emojiContainer.appendChild(docFragment1);
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function (user, msg, color) {
        
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
        if(user!="me"){
            msgToDisplay.style.color="green";
            msgToDisplay.style.marginLeft="40px";
            msgToDisplay.style.border="2px solid #dedede";
            msgToDisplay.style.backgroundImage='./content/happy.png';
            msgToDisplay.style.borderRadius='5px';
            msgToDisplay.style.margin= '10px 0 ';
            msgToDisplay.style.backgroundColor="#94C2ED";
            msgToDisplay.style.padding="10px";
            msgToDisplay.style.marginLeft="60px";            
           
        }else{
            msgToDisplay.style.border="2px solid #dedede";
            msgToDisplay.style.borderRadius='5px';
            msgToDisplay.style.borderpadding= "15px 15px";
            msgToDisplay.style.bordermargin= '10px 10px';
            msgToDisplay.style.backgroundColor=" #86BB71";
            msgToDisplay.style.padding="10px";
            msgToDisplay.style.margin= '10px 0 ';          
        }

    },
    _displayImage: function (user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function (msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        console.log(totalEmojiNum);
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            console.log(emojiIndex);

            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else if (emojiIndex <= 69) {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.png"/>');
            }
        };
        return result;
    }
};
