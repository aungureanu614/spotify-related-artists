var unirest = require('unirest');
var express = require('express');
var events = require('events');

var getFromApi = function(endpoint, args) {
    var emitter = new events.EventEmitter();
    unirest.get('https://api.spotify.com/v1/' + endpoint)
           .qs(args)
           .end(function(response) {
                if (response.ok) {
                    emitter.emit('end', response.body);
                }
                else {
                    emitter.emit('error', response.code);
                }
            });
    return emitter;
};

var app = express();
app.use(express.static('public'));

app.get('/search/:name', function(req, res) {
   
    var searchReq = getFromApi('search', {
        q: req.params.name,
        limit: 1,
        type: 'artist'
    });

    var onSearch = function(item){
        var artist = item.artists.items[0];
        var relatedReq = getFromApi('artists/' + artist.id + '/related-artists');
        relatedReq.on('end', function(item) {
            artist.related = item.artists;
            res.json(artist);
        });
        
    };
    
    var onError = function(){
        res.sendStatus(404);
    };

  
    searchReq.on('end', onSearch);
    searchReq.on('error', onError);
});



app.listen(process.env.PORT || 8080);