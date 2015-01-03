var fs = require('fs');
var Q = require('q');
var xml2js = require('xml2js');
var sprintf = require('sprintf').sprintf;

var keyTypes = {
  'Major Version': 'integer',
  'Minor Version': 'integer',
  'Date': 'date',
  'Application Version': 'string',
  'Features': 'integer',
  'Show Content Ratings': 'boolean',
  'Music Folder': 'string',
  'Library Persistent ID': 'string',
  'Tracks': 'dict',
  'Playlists': 'array',
  'Name': 'string',
  'Master': 'boolean',
  'Playlist ID': 'integer',
  'Playlist Persistent ID': 'string',
  'Visible': 'boolean',
  'All Items': 'boolean',
  'Protected': 'boolean',
  'Purchased': 'boolean',
  'Playlist Items': 'array',
  'Track ID': 'integer',
	'Artist': 'string',
	'Album Artist': 'string',
	'Composer': 'string',
	'Album': 'string',
	'Genre': 'string',
	'Kind': 'string',
	'Size': 'integer',
	'Total Time': 'integer',
	'Disc Number': 'integer',
	'Disc Count': 'integer',
	'Track Number': 'integer',
	'Track Count': 'integer',
	'Year': 'integer',
	'Date Modified': 'date',
	'Date Added': 'date',
	'Bit Rate': 'integer',
	'Sample Rate': 'integer',
	'Comments': 'string',
	'Play Count': 'integer',
	'Play Date': 'integer',
	'Play Date UTC': 'date',
	'Artwork Count': 'integer',
	'Persistent ID': 'string',
	'Track Type': 'string',
	'Location': 'string',
	'File Folder Count': 'integer',
	'Library Folder Count': 'integer',
  'Skip Count': 'integer',
  'File Type': 'integer',
  'Skip Date': 'date',
  'Release Date': 'date',
  'Compilation': 'boolean',
  'Explicit': 'boolean',
  'Sort Artist': 'string',
  'Sort Album Artist': 'string',
  'Grouping': 'string',
  'Sort Album': 'string',
  'Sort Name': 'string',
  'Track Type': 'string'
};

var typeFor = function(key) {
  var type = keyTypes[key];
  if (type == undefined) {
    console.log(sprintf("WARN: key not mapped: %s", key));
  }
  return type || 'string';
};

var findElement = function(dict, key) {
  var type = typeFor(key);

  var found = false;
  var index = 0;
  for (var i=0; i<dict.key.length; i++) {
    var k = dict.key[i];
    if (key == k) {
      found = true;
      break;
    }
    if (typeFor(k) == type) {
      index++;
    }
  }

  if (found) {
    return dict[type][index];
  } else {
    return null;
  }
};

var Playlist = function(dict) {
  this.name = findElement(dict, 'Name');
  this.songIds = [];

  var songDicts = findElement(dict, 'Playlist Items');
  if (songDicts != null) {
    this.songIds = songDicts.dict.map(function(dict) { return findElement(dict, 'Track ID'); });
  }

  this.valid = function() {
    return this.songIds.length > 0;
  };
};

var Library = function(doc) {
  var playlists = null;
  var root = doc.plist.dict[0];

  this.getPlaylists = function() {
    if (playlists == null) {
      var playlistDicts = findElement(root, 'Playlists').dict;
      playlists = playlistDicts.map(function(dict) { return new Playlist(dict); });
    }

    return playlists;
  };

  this.songPath = function(id) {
    var tracks = findElement(root, 'Tracks');
    var i;
    for (i=0; i<tracks.key.length; i++) {
      if (tracks.key[i] == id) break;
    }
    return findElement(tracks.dict[i], 'Location');
  };
};

exports.parse = function(file) {
  var deferred = Q.defer();
  var parser = new xml2js.Parser();
  fs.readFile(file, function(err, data) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      parser.parseString(data, function (err2, result) {
        if (err2) {
          deferred.reject(new Error(err2));
        } else {
          deferred.resolve(new Library(result));
        }
      });
    }
  });
  return deferred.promise;
};
