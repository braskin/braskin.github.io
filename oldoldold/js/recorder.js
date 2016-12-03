(function(window) {

  var encoderMp3Worker = new Worker('js/enc/mp3/mp3Worker.js');

  var Recorder = function(source) {

    var bufferLen = 4096;
    var recording = false;

    this.Recordings = {};
    this.userName = null;
    this.userEmail = null;
    this.storyTitle = null;
    this.currentRecording = null;
    this.currentRecordingFileName = null;
    this.player = null;

    this.context = source.context;

    /*
      ScriptProcessorNode createScriptProcessor (optional unsigned long bufferSize = 0,
       optional unsigned long numberOfInputChannels = 2, optional unsigned long numberOfOutputChannels = 2 );
    */

    this.node = (this.context.createScriptProcessor || this.context.createJavaScriptNode).call(this.context, bufferLen, 1, 1);
    this.node.connect(this.context.destination); //this should not be necessary

    this.node.onaudioprocess = function(e) {

      if (!recording)
        return;

      (e.inputBuffer);
      var channelLeft = e.inputBuffer.getChannelData(0);

      console.log('onAudioProcess' + channelLeft.length);

      encoderMp3Worker.postMessage({
        command: 'encode',
        buf: channelLeft
      });
    }

    source.connect(this.node);

    this.record = function() {

      if (recording)
        return false;

      recording = true;

      var sampleRate = this.context.sampleRate;

      console.log("Initializing to Mp3");

      encoderMp3Worker.postMessage({
        command: 'init',
        config: {
          channels: 1,
          mode: 3 /* means MONO*/ ,
          samplerate: 22050,
          bitrate: 64,
          insamplerate: sampleRate
        }
      });

    }

    this.stop = function() {

      if (!recording)
        return;


      encoderMp3Worker.postMessage({
        command: 'finish'
      });

      recording = false;

    }

    this.uploadAudioToStorage = function(callback) {
      console.log("IN UPLOAD TO S3")

      var bucket = new AWS.S3({params: {Bucket: 'upstory'}});
      var params = {Key: audioRecorder.currentRecordingFileName, Body: audioRecorder.currentRecording};
      bucket.upload(params, function (err, data) {
        if (err) {
          console.log("Failed to upload: ");
        } else {
          callback();
          console.log("Uploaded");
        }

        console.log(err);
        console.log(data);
      });
    }

    this.storeNewStory = function(callback) {
      console.log("Storing New Story on Parse");

      Parse.User.logIn("new_story", "new_story", {
        success: function(user) {
          console.log("LOGGEDIN");
          var Story = Parse.Object.extend("Story");
          var storyObject = new Story();
            storyObject.save({audioUrl: audioRecorder.currentRecordingFileName, storyTitle: audioRecorder.storyTitle, userEmail: audioRecorder.userEmail, userName: audioRecorder.userName}, {
            success: function(object) {
              if (callback) {
                callback('success', object);
              }

              console.log("Stored successfully")
            },
            error: function(model, error) {
              if (callback) {
                callback('error', error);
              }
              console.log("Failed To Store");
            }
          });
          // Do stuff after successful login.
        },
        error: function(user, error) {
          // The login failed. Check error to see why.
        }
      });
    }


    encoderMp3Worker.onmessage = function(e) {

      var command = e.data.command;

      console.log('encoderMp3Worker - onmessage: ' + command);

      switch (command) {
        case 'data':
          var buf = e.data.buf;
          console.log('Receiving data from mp3-Encoder');


          //maybe you want to send to websocket channel, as:
          //https://github.com/akrennmair/speech-to-server

          break;
        case 'mp3':
          var buf = e.data.buf;
          endFile(buf, 'mp3');
          break;
      }

    };

    function endFile(blob, extension) {

      console.log("Done converting to " + extension);

      console.log("the blob " + blob + " " + blob.size + " " + blob.type);

      var url = URL.createObjectURL(blob);

      console.log(audioRecorder.Recordings);
      audioRecorder.currentRecording = blob;
      audioRecorder.currentRecordingFileName = new Date().toISOString() + '.' + extension;

      console.log("Calling wavesurfer loadblob");

      if (audioRecorder.player) {
        player.load(url);
      }

      console.log("After Calling wavesurfer loadblob");
    }
  };

  window.Recorder = Recorder;
})(window);
