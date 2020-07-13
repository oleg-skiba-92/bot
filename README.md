# Bot

Telegram and viber bot

## Requirements

- NodeJS v8 or above
- PostgreSQL v9.5
- PM2 installed globally (optional)
- created bots іn Telegram and Viber 

## Installation

- clone project
- run `npm install`
- create .env file with that parameters:
```
 PORT=3000
 LOG_LEVEL=INFO   // ('OFF' | 'INFO' | 'DEBUG')

 DB_HOST=localhost
 DB_PORT=5432
 DB_NAME=DatabaseName
 DB_USER=PostgresUser
 DB_PASSWORD=PostgresUserPassword
 
 VIBER_TOKEN=viber-bot-token
 TELEGRAM_TOKEN=telegram-bot-token
 API_TOKEN=api-token
 
 BASE_URL=https://yordomain.com
 API_URL=https://yorAPI.com
 ```

## Start project

`npm run start:prod` 

or

`pm2 start ./process.json`

## Helps and links

For running in the local environment use [NgRok](https://developers.viber.com/blog/2017/05/24/test-your-bots-locally)

[PM2 documentation](https://pm2.keymetrics.io/docs/usage/process-management/)

[PostgreSQL installation documentation](https://www.postgresql.org/docs/9.5/tutorial-install.html)
