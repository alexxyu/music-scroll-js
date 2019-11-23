const express = require('express');
const app = express();

app.get('/opencv.js', function(request, response) {
    response.sendFile(__dirname + '/node_modules/opencv.js/opencv.js');
});

app.get('/', (request, response) => {
    response.sendFile(__dirname + '/index.html');
});

console.log('App is running!');
app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode.", this.address().port, app.settings.env);
});
