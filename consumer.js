import { AMQPClient } from '@cloudamqp/amqp-client'
import {} from 'dotenv/config'
import nodemailer from 'nodemailer'
import config from './config.js';
//const nodemailer = require('nodemailer');
//const config = require("./config");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

async function startConsumer() {
  //Setup a connection to the RabbitMQ server
  const cloudAMQPURL = process.env.CLOUDAMQP_URL
  const connection = new AMQPClient(cloudAMQPURL)
  await connection.connect()
  const channel = await connection.channel()

  console.log("[✅] Connection over channel established")

  const q = await channel.queue('email.otp')

  let counter = 0;

  const consumer = await q.subscribe({noAck: false}, async (msg) => {
    try {
      console.log(`[📤] Message received (${++counter})`, msg.bodyToString())
      //const message = JSON.parse(msg.bodyToString());
      // console.log(message.email);

      
        const data = JSON.parse(msg.bodyToString());
        const subject= data.subject
        const body = data.body
        const to = data.email
        //channel.ack(msg);
    
        const from = config.mail.from;
    transporter.sendMail({
        from: from, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: body, // plain text body
        // html: "<b>This was not sent by a human being</b>", // html body
      }).then(info => {
        console.log({info});
      }).catch(console.error);
      

      msg.ack()
    } catch (error) {
      console.error(error)
    }
  })

  //When the process is terminated, close the connection
  process.on('SIGINT', () => {
    channel.close()
    connection.close()
    console.log("[❎] Connection closed")
    process.exit(0)
  });
}

startConsumer().catch(console.error);