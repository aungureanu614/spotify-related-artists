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
    
    
    
    var getTracks = function(artist, cb){
         var tracksReq = getFromApi('artists/' + artist.id + '/top-tracks?country=US');
         tracksReq.on('end', function(item) {
             artist.tracks = item.tracks;
            cb();
            
         })
    }
    

    var onSearch = function(item){
        var artist = item.artists.items[0];
        
        var relatedReq = getFromApi('artists/' + artist.id + '/related-artists');
        relatedReq.on('end', function(item) {
            artist.related = item.artists;
            
           
            
            artist.related.forEach(function(artist){
               getTracks(artist, function(err){
                   if(err){
                       res.sendStatus(404);
                   }
                   completed +=1
                   checkComplete();
                   
               }); 
            });
            
            var total = artist.related.length;
            var completed = 0;
            
            function checkComplete(){
                if(completed === total){
                    res.json(artist);
                }
            }
         
        });
        
        
    };
    
    searchReq.on('end', onSearch);
   
});



app.listen(process.env.PORT || 8080);