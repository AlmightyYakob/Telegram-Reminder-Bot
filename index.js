var https = require('https');
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var log4js = require('log4js');
var axios = require('axios');
var fs = require('fs');

var app = express();

const BOT_TOKEN = '459017535:AAHOlNDZ1lRwzpo_-34daWHuZpUXkQ8M4Ec';
const SSL_OPTIONS = {
    key: fs.readFileSync('/etc/ssl/private/apache-selfsigned.key'),
    cert: fs.readFileSync('/etc/ssl/certs/apache-selfsigned.crt')
};

// const GET_UPDATE_URL = 'https://api.telegram.org/bot' + BOT_TOKEN + "/getUpdates";

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded


log4js.configure({
	appenders: { normal: { type: 'file', filename: 'live.log' } },
    categories: { default: { appenders: ['normal'], level: 'debug' }}
});

var logger = log4js.getLogger('normal');


//In milliseconds
const time_units = {
    second: 1000,
    minute: 60000,
    hour: 3600000,
    day: 86400000,
    week: 604800000,
    month: 2419200000,
    year: 29030400000
};


setTimeout(getUpdates, 1000);

// var mostRecentUpdate = 0;
function getUpdates(){
    console.log("Getting Updates...");
    axios.get(GET_UPDATE_URL, {
        params: {
            offset: mostRecentUpdate
        }
    }).then(function(response){
        console.log("Updates recieved.");

        var result = response.data.result;
        console.log(result);
        mostRecentUpdate = getMaxInObjectArray(result, 'update_id');

        for (var update in result){
            var currentUpdate = result[update];

            console.log(JSON.stringify(currentUpdate));
            if (!currentUpdate.message) {
                console.log("No message!");
            }
            else{
                var text = currentUpdate.message.text;

                var matches = [];
                for (var key in time_units){
                    var regex = new RegExp("(\\d{1,10}.?\\d{0,10}) " + key + 's?');
                    var match;
                    if ((match = regex.exec(text)) != null){
                        //Means valid number has been matched

                        var num = match[1];
                        console.log('match: ' + match[1]);
                        matches.push(parseFloat(num));
                        matches.push(key);
                        break;
                    }
                }

                if (matches.length == 0){
                    console.log("No match found for " + text);
                }
                else{
                    var units = matches[matches.length-1];
                    var num = matches[0];
                    console.log(matches);
                    var timeToWait = num*time_units[units];
                    console.log("TTW: " + timeToWait);

                    setTimeout(function(){
                        forwardMessage(currentUpdate.message.from.id, currentUpdate.message.chat.id, currentUpdate.message.message_id)
                    }, timeToWait);

                    confirmReminderSet(currentUpdate.message.chat.id, currentUpdate.message.message_id, num, units);
                }
            }
        }
    }).catch(function (error){
        console.log(error);
    });
}

function confirmReminderSet(chat_id, reply_to_message_id, numberOfUnits, units){
    axios.post('https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage', {
            chat_id: chat_id,
            text: 'Reminder set for ' + numberOfUnits + ' ' + units + 's' + ' from now.',
            reply_to_message: reply_to_message_id
    })
    .then(response => {
        // We get here if the message was successfully posted
        console.log('Message posted')
    })
    .catch(err => {
        // ...and here if it was not
        console.log('Error :', err)
    })
}

function getMaxInObjectArray(arrayOfObjects, maxField){
    var max = 0;

    for (var item in arrayOfObjects){
        if (item.maxField > max) max = item.maxField;
    }

    return max;
}

//Function called to forward message, usually set on a timer.
function forwardMessage(chat_id, from_chat_id, message_id){
    console.log('Forward Message');

    axios.post('https://api.telegram.org/bot' + BOT_TOKEN + '/forwardMessage', {
        chat_id: chat_id,
        from_chat_id: from_chat_id,
        message_id: message_id
    })
        .then(response => {
            // We get here if the message was successfully posted
            console.log('Message posted')
        })
        .catch(err => {
            // ...and here if it was not
            console.log('Error :', err)
        });
}

//https.createServer(SSL_OPTIONS, app).listen(443);
