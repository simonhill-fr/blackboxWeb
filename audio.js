
import Utm, { LatLon, Dms } from 'https://cdn.jsdelivr.net/npm/geodesy@2.2.1/utm.js';
import Vector3d from 'https://cdn.jsdelivr.net/npm/geodesy@2/vector3d.js';


// 3 rue roberval
// 48.894391973785375, 2.322213871399862

const target = {
    latitude : 48.89353893327512,
    longitude: 2.3243825143093972
  };

var originVector = new Vector3d(1, 0, 0);
var targetVector = new Vector3d(300, 0, 0);

var filter = new Tone.Filter(50000, "lowpass").toDestination();

unmuteButton.addEventListener('click', function() 
{
    var options = {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      };
    navigator.geolocation.watchPosition(receivePosition, receivePositionError, options);
    
    getAccel();
    
    Tone.start();
    const player = new Tone.Player("https://raw.githubusercontent.com/simonhill-fr/asset/master/pad.wav").connect(filter);
    player.loop = true;
    Tone.loaded().then(() => {
        player.start();
    });
});

function getAccel(){
    console.log("getAccel");
    DeviceMotionEvent.requestPermission().then(response => {
        console.log(response);
        if (response == 'granted') {     
            // Add a listener to get smartphone orientation 
            window.addEventListener('deviceorientation', receiveCompass);
        }
    });
}

function receiveCompass(event)
{
    var compass = event.webkitCompassHeading;
    document.getElementById("compass").innerHTML = compass;
    let tempVector = targetVector.rotateAround(new Vector3d(0, 0, 1), compass).times(targetVector.length);
    // var radians = originVector.angleTo(tempVector, new Vector3d(0, 0, 1));
    // if (radians < 0) {
    //     radians += 2 * Math.PI;
    // }
    // var degrees = radians * 180 / Math.PI;
    // console.log("angle:" + degrees);

    var radians = originVector.angleTo(tempVector);
    var degrees = radians * 180 / Math.PI;
    // var aim = scale(degrees, 0, 180, 0, 1);
    // console.log("aim:" + aim);

    const scale = new Tone.Scale(50, 100);
    const signal = new Tone.Signal(0.5).connect(scale);
    // console.log(signal.value);


    // source.setPosition(tempVector.x / 2, tempVector.y / 2, 0);
    // console.log("target x:" + tempVector.x + " target y:" + tempVector.y + " length:" + targetVector.length);
}

function receivePosition(position)
{
    const p = new LatLon(position.coords.latitude, position.coords.longitude);
    const t = new LatLon(target.latitude, target.longitude);
    
    const pUtm = p.toUtm();
    const tUtm = t.toUtm();

    var x = tUtm.easting - pUtm.easting;
    var y = tUtm.northing - pUtm.northing;

    targetVector.x = x;
    targetVector.y = y;
}

function receivePositionError(err)
{
    console.warn('ERROR(' + err.code + '): ' + err.message);
}




function scale (num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}


// var source;
// Audio
// function playAudioSource()
// {
//     // Create an AudioContext
//     let audioContext = new AudioContext();

//     // Create a (first-order Ambisonic) Resonance Audio scene and pass it
//     // the AudioContext.
//     let resonanceAudioScene = new ResonanceAudio(audioContext);

//     // Connect the scene’s binaural output to stereo out.
//     resonanceAudioScene.output.connect(audioContext.destination);

//     // Create an AudioElement.
//     let audioElement = document.createElement('audio');

//     audioElement.crossOrigin = 'anonymous';

//     // Load an audio file into the AudioElement.
//     audioElement.src = 'https://raw.githubusercontent.com/simonhill-fr/asset/master/pad.wav';

//     // Generate a MediaElementSource from the AudioElement.
//     let audioElementSource = audioContext.createMediaElementSource(audioElement);

//     // Add the MediaElementSource to the scene as an audio input source.
//     source = resonanceAudioScene.createSource();
//     audioElementSource.connect(source.input);

//     source.setMinDistance(50);
//     source.setMaxDistance(3000);

//     // Set the source position relative to the room center (source default position).
//     source.setPosition(200, 0, 0);

//     // Play the audio.
//     audioElement.muted = false;
//     audioElement.play();

// }
