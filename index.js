const express = require('express');
const app = express();

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

console.log('App is running!');
app.listen(3000);