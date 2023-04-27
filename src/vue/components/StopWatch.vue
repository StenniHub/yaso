<template>
  <div id="clock">
  
    <span class="time" :class="{ running: this.running, stopped: this.stopped}">{{ this.time }}</span>       

    <div class="btn-container">
      <icon-button icon="mdi-play" :onClick="start" tooltip="Start timer" :disabled="running" />
      <icon-button icon="mdi-pause" :onClick="pause" tooltip="Pause timer" :disabled="!running" />
      <icon-button icon="mdi-stop" :onClick="stop" tooltip="Stop timer" :disabled="stopped || startedAt == null" />
    </div>
  
  </div>
</template>
  
<script lang="ts">
import Vue from "vue";
import IconButton from "./IconButton.vue";

const StopWatch = Vue.extend({
  components: { IconButton },
  data: (): Record<string, unknown> => ({
    time: "00:00.000",
    startedAt: null,
    pausedAt: null,
    pausedDuration: 0,
    interval: null,
    running: false,
    stopped: false
  }),
  props: {
    onStart: {  // Only triggered again a full stop
      type: Function
    },
    onPause: {
      type: Function
    },
    onStop: {
      type: Function
    }
  },
  methods: {
    start(): void {
      if (this.running) return;
            
      if (this.startedAt === null) {
        this.reset();
        this.startedAt = new Date();
        if (this.onStart) this.onStart();
      }

      if (this.pausedAt !== null) {
        this.pausedDuration += (new Date().valueOf() - this.pausedAt);
      }

      this.interval = setInterval(this.clockRunning, 10);	
      this.running = true;
    },
    pause(): void {
      this.running = false;
      this.pausedAt = new Date();
      clearInterval(this.interval);
      if (this.onPause) this.onPause();
    },
    stop(): void {
      this.stopped = true;
      this.pausedDuration = 0;
      this.startedAt = null;
      this.pausedAt = null;
      clearInterval(this.interval);

      if (this.running) {
        this.running = false;
      } else {
        this.reset();
      }

      if (this.onStop) this.onStop();
    },
    reset(): void {
      if (!this.stopped) this.stop();
      this.stopped = false;
      this.time = "00:00.000";
    },
    clockRunning(): void {
      var currentTime = new Date().valueOf();
      var timeElapsed = new Date(currentTime - this.startedAt - this.pausedDuration);
      var min = timeElapsed.getUTCMinutes();
      var sec = timeElapsed.getUTCSeconds();
      var ms = timeElapsed.getUTCMilliseconds();

      this.time = this.zeroPrefix(min, 2) + ":" + this.zeroPrefix(sec, 2) + "." + this.zeroPrefix(ms, 3);
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