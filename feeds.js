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
        var month = monthNames[date.getMonth()];
        var result = {
          id: idx,
          title: $item.find('title').text(),
          link:  $item.find('link').text(),
          text: $item.find('description').text(),
          date: month,
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
    var feed = data.feed;
    var raw = $.makeArray(feed.entry);
    var results = $.map(raw, function(item, idx) {  
      var date = new Date(item.date);
      var month = monthNames[date.getMonth()];
      // Capture odd Youtube ID.
      var ids = item.id.$t.split('/');
      var result = {
        id: ids[ids.length-1],
        title: item.title.$t,
        date: month,
        thumbnail: item.media$group.media$thumbnail[0].url,
        playerUrl: item.media$group.media$content[0].url,
        raw_video: item.media$group.media$content[1].url
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
  $scope.feeds = {
    readYoutube: readYoutubeFeed,
    readLibsyn:  readLibsynFeed
  }

})($, window);
