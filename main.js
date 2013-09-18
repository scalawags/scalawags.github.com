(function(){

  var youtubeUrl = 'https://gdata.youtube.com/feeds/api/users/UCHxNwi3l5CGZo1kG47k7i2Q/uploads?alt=json-in-script';
  var libsynUrl = '/rss';


  function embeddedPlayerUrl(id) {
    return 'http://www.youtube.com/v/'+id+'?version=3&enablejsapi=1';
  }


  function currentUri() {
    // TODO - Cross browser?
    if(/.*localhost.*/.exec(window.location.href)) {
      return '/';
    }
    return window.location.pathname;
  }
  function isDetailsUri() {
    var uri = currentUri();
    return uri && uri != '/';
  }
  function normalizeName(name) {
    return name.replace(/[^\w]/gi, '').toLowerCase();
  }
  function titleMatchesUri(podcast) {
    return normalizeName(currentUri().slice(1)) == normalizeName(podcast.title());
  }

  function Podcast(config) {
    var self = this;
    self.timestamp = config.timestamp || new Date();
    self.id = ko.observable(config.id || '');
    self.title = ko.observable(config.title);
    self.date = config.date;
    self.thumbnail = config.thumbnail || '';
    self.hasVideo = ko.computed(function() {
      return self.id() != '';
    });
    self.embedUrl = ko.computed(function() {
      return embeddedPlayerUrl(self.id()) + "&showinfo=0&autoplay=1";
    });
    self.audio = ko.observable(config.audio);
    self.hasAudio = ko.observable(config.audio ? true : false);
    // Loaded later
    self.audioDisplayCss = ko.computed(function() {
      return self.hasAudio() ? '' : 'hide';
    });
    self.audioLink = ko.observable();
    self.shownotes = ko.observable(config.text);

    // User controlled state/actions
    self.expandedVideo = ko.observable(false);
    self.toggleVideo = function() {
      self.expandedVideo(!self.expandedVideo());
    }

    self.expandedNotes = ko.observable(false);
    self.toogleNotes = function() {
      self.expandedNotes(!self.expandedNotes());
    }

    // Play controls - TODO - move these into custom model...
    self.audioLoaded = ko.observable(false);
    self.play = function() {
      //if(!self.audioLoaded()) { self.audioLoaded(true); }
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
      return self.playing() ? 'pause' : self.audioDisplayCss();
    });
    // TODO - figure out how to bind this directly to the audio element...
    self.currentTime = ko.observable(0);
    self.duration = ko.observable(1);
    self.percent = ko.computed(function() {
      return (self.currentTime() / self.duration())*100;
    });
    self.audioEl = ko.observable();
    self.skipTo = function(data, e) {
      var audio = self.audioEl();
      if (audio) {
        var left = e.offsetX;
        var progress = e.currentTarget;
        var percent = left / ($(progress).width() );
        audio.currentTime = percent * audio.duration;
      }
    };
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
      if(self.hasAudio()) {
        return timeToString(self.currentTime()) + " / " + self.durationString();
      }
      return 'Audio not available';
    });
  }

  function PageModel() {
    var self = this;
    self.podcasts = ko.observableArray();
    self.sortedPodcasts = ko.computed(function() {
       var copy = self.podcasts().slice(0);
       return copy.sort(function(l,r) { return r.timestamp.getTime()  - l.timestamp.getTime(); });
    });
    self.shownpodcasts = ko.computed(function() {
      if(isDetailsUri()) {
        // Just return the details of one podcast...
        return ko.utils.arrayFilter(self.podcasts(), function(podcast) {
          return titleMatchesUri(podcast);
        });
      }
      //TODO - paginate!
      return self.sortedPodcasts() //.slice(0,12);
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
             var found = false;
             for(var i = 0; i < podcasts.length; ++i) {
               var podcast = podcasts[i];
               if(podcast.date == audio.date) {
                 // Assume these line up....
                 podcast.audio(audio.audio);
                 podcast.title(audio.title);
                 podcast.shownotes(audio.text);
                 podcast.hasAudio(true);
                 found = true;
               }
             }
             if(!found) {
             // Push podcast anyway (no corresponding video)
             console.log('No podcast video for: ', audio);
             self.podcasts.push(new Podcast(audio));
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
