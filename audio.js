
function startAudio()
{
    Tone.start();
    const player = new Tone.Player("https://raw.githubusercontent.com/simonhill-fr/asset/master/pad.wav").connect(filter);
    player.loop = true;
    Tone.loaded().then(() => {
        player.start();
    });
}