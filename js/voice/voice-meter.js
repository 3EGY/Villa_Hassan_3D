/** Optional microphone energy analyser for the voice orb. Falls back to CSS pulse. */
(function(global) {
    'use strict';
    let tracks=null, context=null, analyser=null, animation=0, generation=0;
    function stop() {
        generation++;
        if(animation) cancelAnimationFrame(animation);
        animation=0;
        if(tracks) tracks.getTracks().forEach(track=>track.stop());
        tracks=null;
        if(context) void context.close().catch(()=>{});
        context=null;analyser=null;
        const layer=document.getElementById('voice-live');
        if(layer)layer.style.setProperty('--voice-energy','0.08');
    }
    async function start() {
        stop();
        const serial=generation;
        if(!navigator.mediaDevices?.getUserMedia)return false;
        let stream;
        try {stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});}
        catch {return false;}
        if(serial!==generation){stream.getTracks().forEach(t=>t.stop());return false;}
        tracks=stream;
        const AudioContextClass=global.AudioContext||global.webkitAudioContext;
        if(!AudioContextClass)return false;
        try {
            context=new AudioContextClass();
            const source=context.createMediaStreamSource(stream);
            analyser=context.createAnalyser();
            analyser.fftSize=256;
            analyser.smoothingTimeConstant=.76;
            source.connect(analyser);
            const values=new Uint8Array(analyser.fftSize);
            const layer=document.getElementById('voice-live');
            const bars=[...document.querySelectorAll('.voice-orb-bars i')];
            function draw() {
                if(serial!==generation || !analyser)return;
                analyser.getByteTimeDomainData(values);
                let total=0;
                for(const value of values)total+=Math.pow((value-128)/128,2);
                const energy=Math.min(1,Math.sqrt(total/values.length)*6.5);
                if(layer)layer.style.setProperty('--voice-energy',energy.toFixed(3));
                bars.forEach((bar,i)=>{bar.style.height=(9+Math.round(energy*(11+(3-Math.abs(3-i))*9)))+'px';});
                animation=requestAnimationFrame(draw);
            }
            animation=requestAnimationFrame(draw);
            return true;
        }catch {stop();return false;}
    }
    global.VillaVoiceMeter=Object.freeze({start,stop});
})(window);
