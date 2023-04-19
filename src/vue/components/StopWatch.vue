<template>
  <div id="clock">
  
    <span class="time">{{ this.time }}</span>
        
    <div class="btn-container">
      <a @click="this.start">Start</a>
      <a @click="this.pause">Pause</a>
      <a @click="this.stop">Stop</a>
    </div>
  
  </div>
</template>
  
<script lang="ts">
import Vue from "vue";

const StopWatch = Vue.extend({
  data: (): Record<string, unknown> => ({
    time: "00:00.000",
    timeBegan: null,
    timeStopped: null,
    stoppedDuration: 0,
    started: null,
    running: false
  }),
  methods: {
    start(): void {
      if(this.running) return;
            
      if (this.timeBegan === null) {
        this.reset();
        this.timeBegan = new Date();
      }

      if (this.timeStopped !== null) {
        this.stoppedDuration += (new Date().valueOf() - this.timeStopped);
      }

      this.started = setInterval(this.clockRunning, 10);	
      this.running = true;
    },
    pause(): void {
      this.running = false;
      this.timeStopped = new Date();
      clearInterval(this.started);
    },
    stop(): void {
      this.running = false;
      clearInterval(this.started);
      this.stoppedDuration = 0;
      this.timeBegan = null;
      this.timeStopped = null;
    },
    reset(): void {
      this.running = false;
      clearInterval(this.started);
      this.stoppedDuration = 0;
      this.timeBegan = null;
      this.timeStopped = null;
      this.time = "00:00.000";
    },
    clockRunning(): void {
      var currentTime = new Date().valueOf();
      var timeElapsed = new Date(currentTime - this.timeBegan - this.stoppedDuration);
      var min = timeElapsed.getUTCMinutes();
      var sec = timeElapsed.getUTCSeconds();
      var ms = timeElapsed.getUTCMilliseconds();

      this.time = 
                this.zeroPrefix(min, 2) + ":" + 
                this.zeroPrefix(sec, 2) + "." + 
                this.zeroPrefix(ms, 3);
    },
    zeroPrefix(num, digit): string {
      var zero = '';
      for (var i = 0; i < digit; i++) {
        zero += '0';
      }

      return (zero + num).slice(-digit);
    }
  }
});
  
export default StopWatch;
</script>