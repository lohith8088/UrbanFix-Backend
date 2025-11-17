// utils/sms.js
import dotenv from 'dotenv';
dotenv.config();

const USE_TWILIO = process.env.USE_TWILIO === 'true';
let client = null;

if (USE_TWILIO) {
  // dynamic import works in ESM
  const twilio = await import('twilio');
  client = twilio.default(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSms(to, body) {
  if (USE_TWILIO && client) {
    return client.messages.create({ from: process.env.TWILIO_FROM_NUMBER, to, body });
  } else {
    console.log(`[SMS simulated] To: ${to} | Body: ${body}`);
    return { sid: 'SIMULATED' };
  }
}
