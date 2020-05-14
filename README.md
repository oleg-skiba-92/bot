# Bot

Telegram and viber bot

## Requirements

- nodeJS v8 or above
- created bots іn Telegram and Viber 

## Installation

- clone project
- run `npm install`
- create .env file with that parameters:
```
 FB_CERT={"type": "service_account","project_id": "firebase-project-id","private_key_id": "firebase-key-id","private_key": "firebase-private-key","client_email": "firebase-adminsdk-email","client_id": "firebase-client-id","auth_uri": "https://accounts.google.com/o/oauth2/auth","token_uri": "https://oauth2.googleapis.com/token","auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url": "firebase-client_x509_cert_url"}
 FB_DB_URL=https://firebase-project-id.firebaseio.com
 
 VIBER_TOKEN=viber-bot-token
 TELEGRAM_TOKEN=telegram-bot-token
 
 BASE_URL=https://yordomain.com
 ```

## Start project

`npm run start` 

or

`ts-node -r dotenv/config index.ts`

## Helps and links

For running in the local environment use [NgRok](https://developers.viber.com/blog/2017/05/24/test-your-bots-locally)

[Firebase documentation](https://firebase.google.com/docs/admin/setup)
