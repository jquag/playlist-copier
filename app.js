(function () {
  'use strict';

  var util = require('./util');
  var $ = require('jquery');
  var fs = require('fs-extra');
  var Q = require('q');
  var sprintf = require('sprintf').sprintf;
  var path = require('path');

  var library;

  var toggleButton = function($element) {
    $element.toggle();
    $element.next().toggle();
  };

  var populatePlaylists = function() {
    var $select = $('#playlist');
    library.getPlaylists().forEach(function(p) {
      if (p.valid()) {
        var $option = $('<option>'+p.name+'</option>');
        $option.data('playlist', p);
        $select.append($option);
      }
    });
  };

  var loadFile = function(e) {
    var $button = $(this);
    toggleButton($button);

    util.parse(document.getElementById('xml-file').value).then(function(lib) {
      toggleButton($button);
      library = lib;
      populatePlaylists();
      $('#playlist-selection').show();
    }, function(err) {
      alert('failed to parse the XML doc');
      toggleButton($button);
    });
  };

  var handleFileSelected = function() {
    $('#parse').attr('disabled', $(this).val() == '');
    $('#playlist-selection').hide();
  };

  var handlePlaylistInput = function() {
    var disable = $('#playlist').val() == '' || $('#destination').val() == '';
    $('#copy').attr('disabled', disable);
  };

  var resolveSongPath = function(uri) {
    var path = decodeURI(uri);
    return path.replace('file://', '');
  };

  var copySong = function(source, destination, id) {
    var deferred = Q.defer();
    fs.copy(source, path.join(destination, path.basename(source)), function(err) {
      if (err) {
        console.log('failure copying', id, source);
        deferred.reject(new Error(err));
      } else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  };

  var copyPlaylist = function() {
    var playlist = $('#playlist option:selected').data('playlist');
    var destination = $('#destination').val();

    var copyJobs = [];
    playlist.songIds.forEach(function(songId) {
      var source = library.songPath(songId);
      copyJobs.push(copySong(resolveSongPath(source), destination, songId));
    });

    Q.all(copyJobs).then(function() {
      alert('all songs successfully copied');
    }, function(err) {
      alert(sprintf('One or more songs not copied. There was an issue copying a song: %s', err));
    });
  };

  $('#parse').click(loadFile);
  $('#xml-file').change(handleFileSelected);
  $('#playlist-selection :input').change(handlePlaylistInput);
  $('#copy').click(copyPlaylist);
}());
