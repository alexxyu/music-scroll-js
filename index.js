const express = require('express');
const app = express();

app.use('/assets', express.static(__dirname +'/assets'));

app.use('/models', express.static(__dirname +'/models'));

app.get('/face-api.js', (request, response) => {
    response.sendFile(__dirname + '/scripts/face-api.js');
});

app.get('/track.js', (request, response) => {
    response.sendFile(__dirname + '/scripts/track.js');
});

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

console.log('App is running!');
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode.", this.address().port, app.settings.env);
});
