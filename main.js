(function(){

  var youtubeUrl = 'https://gdata.youtube.com/feeds/api/users/UCHxNwi3l5CGZo1kG47k7i2Q/uploads?alt=json-in-script&format=5';
  var libsynUrl = '/rss';


  function embeddedPlayerUrl(id) {
    return 'http://www.youtube.com/v/'+id+'?version=3&enablejsapi=1';
  }

  function Podcast(config) {
    var self = this;
    self.id = ko.observable(config.id);
    self.title = ko.observable(config.title);
    self.date = config.date;
    self.thumbnail = config.thumbnail;
    self.embedUrl = ko.computed(function() {
      return embeddedPlayerUrl(self.id());
    });
    // Loaded later
    self.audio = ko.observable();
    self.audioLink = ko.observable();
    self.shownotes = ko.observable('<i>No Show notes Available</i>');

    // User controlled state/actions
    self.expandedVideo = ko.observable(false);
    self.toggleVideo = function() {
      self.expandedVideo(!self.expandedVideo());
    }

    // Play controls
    self.audioLoaded = ko.observable(false);
    self.play = function() {
      if(!self.audioLoaded()) { self.audioLoaded(true); }
      // TODO - feed events to audio widget?
      var audio = self.audioEl();
      if(audio) {
        if(audio.paused) { 
          audio.play(); 
        } else { 
          audio.pause();
        }
      }
    };
    self.playing = ko.observable(false);
    self.pausedCss = ko.computed(function() {
      if(self.playing()) {
        return 'pause';
      }
      return '';
    });
    self.currentTime = ko.observable(0);
    self.duration = ko.observable(1);
    self.audioEl = ko.observable();
    self.setupPlayer = function(elements) {
      var audio  = $(elements).filter('audio')[0];
      audio.addEventListener('ended', function(evt) {
        audio.pause();
        self.playing(false);
        self.curentTime(0);
      });
      audio.addEventListener('timeupdate', function(e) {
        self.currentTime(this.currentTime);
        self.duration(this.duration);
      });
      audio.addEventListener('loadedmetadata', function(e){
        self.duration(this.duration);
      });
      audio.addEventListener('play', function(e) {
        self.playing(true);
      });  
      audio.addEventListener('pause', function(e) {
        self.playing(false);
      });
      self.audioEl(audio);    
    };
    function timeToString(time) {
      if(time) {
        var min = Math.round( time / 60 ),
            sec = Math.round( time % 60 );
        if (sec < 10) sec = "0"+sec;      
        return min + ":" + sec;
      }
      return '';
    }

    self.durationString = ko.computed(function() {
      return timeToString(self.duration());
    });
    self.timeString = ko.computed(function() {
      return timeToString(self.currentTime()) + " / " + self.durationString();
    });
  }

  function PageModel() {
    var self = this;
    self.podcasts = ko.observableArray();

    self.shownpodcasts = ko.computed(function() {
      //TODO - paginate!
      return self.podcasts().slice(0,12);
    });
    self.load = function() {
      feeds.readYoutube(youtubeUrl, function(feed) {
         // TODO - should we bump into a model?
         self.podcasts($.map(feed, function(i) { return new Podcast(i); }));
         // Now load the audio ->
         feeds.readLibsyn(libsynUrl, function(feed) {
           $.each(feed, function(ignore, audio) {
             // TODO - Try to line up the audio with the video
             var podcasts = self.podcasts();
             for(var i = 0; i < podcasts.length; ++i) {
               var podcast = podcasts[i];
               if(podcast.date == audio.date) {
                 // Assume these line up....
                 podcast.audio(audio.audio);
                 podcast.title(audio.title);
                 podcast.shownotes(audio.text);
               }
             }
           });
         });
      });
    };
    // Load by default.
    self.load();
  }
  window.model = new PageModel();

  ko.applyBindings(window.model);
})();
