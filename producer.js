"use strict";

//------------------------------------------------------------------------------------------------------------------
//  Basic setup in respect to modules, messaging settings and getting messaging options
//------------------------------------------------------------------------------------------------------------------

const msg = require('@sap/xb-msg');
const env = require('@sap/xb-msg-env');
const xsenv = require('@sap/xsenv');
const service = 'my-ems-demo-instance';
const taskList = {
    myOutA : { topic: 'sap/mymsc/demo/e4l' , timerMin: 1, timerMax: 11 },
    myOutB : { topic: 'sap/mymsc/demo/e4l' , timerMin: 5, timerMax:  8 }
};
var counter = 1;

xsenv.loadEnv();

//------------------------------------------------------------------------------------------------------------------
// Start messaging client
//------------------------------------------------------------------------------------------------------------------

const client = new msg.Client(env.msgClientOptions(service, [], ['myOutA', 'myOutB']));


function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return (Math.floor(Math.random() * (max - min + 1)) + min) * 1000;
}

function initTasks(tasks, client) {
    Object.getOwnPropertyNames(tasks).forEach((id) => {
        const task = tasks[id];
        const stream = client.ostream(id);

        const handler = () => {
            console.log('publishing message number ' + counter + ' to topic ' + task.topic);

            const message = {
                payload: Buffer.from("Message Number " + counter)

            };
            if (!stream.write(message)) {
                console.log('wait');
                return;
            }
            setTimeout(handler, getRandomInt(task.timerMin, task.timerMax));
            counter++;
        };

        stream.on('drain', () => {
            setTimeout(handler, getRandomInt(task.timerMin, task.timerMax));
        });

        setTimeout(handler, getRandomInt(task.timerMin, task.timerMax));
    });
}

//------------------------------------------------------------------------------------------------------------------
// Messaging client handler methods
//------------------------------------------------------------------------------------------------------------------

client
    .on('connected', () => {
        console.log('connected');
        initTasks(taskList, client);
    })
    .on('drain', () => {
        console.log('continue');
    })
    .on('error', (error) => {
        console.log(error);
    });

client.connect();
