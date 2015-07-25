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
      log.innerHTML += "\n" + "Creating Empty Mp3:" + sampleRate;

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
      log.innerHTML += "\n" + "Uploading audio to storage";

      var bucket = new AWS.S3({params: {Bucket: 'upstory'}});
      var params = {Key: audioRecorder.currentRecordingFileName, Body: audioRecorder.currentRecording};
      bucket.upload(params, function (err, data) {
        if (err) {
          log.innerHTML += "\n" + "Failed upload audio to storage: " + err;
        } else {
          callback();
          log.innerHTML += "\n" + "Uploaded audio to storage: ";
        }

        console.log(err);
        console.log(data);

        // bucket.listObjects(function (err, data) {
        //   if (err) {
        //     console.log("ERROR: " + err);
        //   } else {
        //     for (var i = 0; i < data.Contents.length; i++) {
        //       console.log(data.Contents[i].Key);
        //     }
        //   }
        // });
      });
    }

    this.storeNewStory = function(callback) {
      log.innerHTML += "\n" + "Storing New Story on Parse";

      Parse.initialize("ujV3jLpgYwWJZiyRt6hQzrxkWduIcLb2CnycWIiN", "5tmmM8RQMgj4mi5Cf6W4pvKKW2yWti0cpgKKXluW");
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

              log.innerHTML += "\n" + "Stored successfully";
            },
            error: function(model, error) {
              if (callback) {
                callback('error', error);
              }

              log.innerHTML += "\n" + "Failed To Store";
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
          // Removed the terminate of the worker - terminate does not allow multiple recordings
          //encoderMp3Worker.terminate();
          //encoderMp3Worker = null;
          break;
      }

    };

    function endFile(blob, extension) {

      console.log("Done converting to " + extension);
      log.innerHTML += "\n" + "Done converting to " + extension;

      console.log("the blob " + blob + " " + blob.size + " " + blob.type);

      var url = URL.createObjectURL(blob);
      // var li = document.createElement('li');
      // var hf = document.createElement('a');
      // hf.href = url;
      // hf.download = new Date().toISOString() + '.' + extension;
      // hf.innerHTML = hf.download;
      // li.appendChild(hf);

      console.log(audioRecorder.Recordings);
      // audioRecorder.Recordings[hf.download] = blob;
      audioRecorder.currentRecording = blob;
      audioRecorder.currentRecordingFileName = new Date().toISOString() + '.' + extension;

      console.log("Calling wavesurfer loadblob");

      wavesurfer.load(url);

      console.log("After Calling wavesurfer loadblob");


      // var au = document.createElement('audio');
      // au.controls = true;
      // au.src = url;
      // audioRecorder.player = au;
      // li.appendChild(au);

      // recordingslist.appendChild(li);
    }
  };

  window.Recorder = Recorder;

})(window);