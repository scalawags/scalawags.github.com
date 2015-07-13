(function($, $scope) {
  // Helper to display months
  var monthNames = [ "January", "February", "March", "April", "May", "June",
                     "July", "August", "September", "October", "November", "December" ];
    
  // Reads a libsyn audio feed and returns parsed info.
  // args:  url -  The url to read
  //        handler -  A function accepting the parsed JSON of the RSS feed.
  function readLibsynFeed(url, handler) {
    $.get(url, function(data) {                           
      var xmlResults = $.makeArray($(data).find('item'));
      var results = $.map(xmlResults, function(item, idx) {  
        var $item = $(item); 
        var date = new Date($item.find('pubDate').text());
        var month = monthNames[date.getUTCMonth()];
        var result = {
          id: idx,
          title: $item.find('title').text(),
          link:  $item.find('link').text(),
          text: $item.find('description').text(),
          date: date.getUTCDate() + ' ' + month,
          timestamp: date,
          audio: $item.find('enclosure').attr('url'),
        }; 
        return result;
      });  
      handler(results);
    });  
  }
  // Parses the JSON result from the youtube API into something
  // less protocol buffer-y and auto-generated and more
  // javascript-y.
  function parseYoutubeFeed(data) {
    var raw = $.makeArray(data.items);
    var results = $.map(raw, function(item, idx) {
      var snippet = item.snippet;
      var date = new Date(snippet.publishedAt);
      var month = monthNames[date.getUTCMonth()];
      var result = {
        id: item.contentDetails.videoId,
        title: snippet.title,
        date: date.getUTCDate() + ' ' + month,
        timestamp: date,
        thumbnail: snippet.thumbnails.default.url
        // TODO - we need to make an additional call to youtube to grab the "embedd HTML" for the video.
        //        for this, we should actually create a new property which can grab the data on demand...
        //playerUrl: item.media$group.media$content[0].url
      }; 
      return result;
    });  
    return results;
  }
  // Reads a youtube feed and returns the parsed info.
  // args:  url - The youtube feed url
  //        handler - a function accepting the parsed feed.
  function readYoutubeFeed(url, handler) {
    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function(data) {
        handler(parseYoutubeFeed(data));
      }
    });
  };

  function parseYoutubeVideo(data) {
    if(data.items && data.items.length) {
      return data.items[0].player.embedHtml;
    }
    return '<span>No youtube video found</span>';
  };

  function getEmbeddHtml(url, handler) {
    $.ajax({
      url: url,
      dataType: 'jsonp',
      success: function(data) {
        handler(parseYoutubeVideo(data));
      }
    })
  }

  // Grabs the embedded youtube HTML for a video.
  // args: id - the youtube id.

  $scope.feeds = {
    readYoutube: readYoutubeFeed,
    readLibsyn:  readLibsynFeed,
    getYoutubeHtml: getEmbeddHtml
  }

})($, window);
