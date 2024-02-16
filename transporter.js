const nodemailer = require('nodemailer');
const config = require("./config");
const amqp = require("amqplib");

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

async function consumeMessages() {
  const url=config.rabbitMQ.url
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  
  const exchangeName=config.rabbitMQ.exchangeName
  await channel.assertExchange(exchangeName, "direct");

  const q = await channel.assertQueue("MailQueue");
  await channel.bindQueue(q.queue, exchangeName, "otp");

  channel.consume(q.queue, (msg) => {
    data = JSON.parse(msg.content);
    const subject= data.subject
    const body = data.body
    const to = data.to
    channel.ack(msg);

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
  });
}

consumeMessages();
