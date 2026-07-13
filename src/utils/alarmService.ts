import { toPersianDigits } from "./shamsi";

/**
 * Service to handle browser notifications and smart alarm sounds
 * inspired by BadSaba precision for legal offices.
 */
export class AlarmService {
  private static audioCtx: AudioContext | null = null;

  static async requestPermission() {
    if ("Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      } catch (err) {
        console.warn("[AlarmService] Notification.requestPermission failed:", err);
        return false;
      }
    }
    return false;
  }

  static playBadSabaAlarm() {
    try {
      // Trigger device vibration if supported (especially for Android silent mode)
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate([1000, 500, 1000, 500, 1000, 500, 1000]);
      }

      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }

      if (!this.audioCtx) return;

      // Resume context if suspended (browser behavior on mobile)
      if (this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;
      
      const playTone = (freq: number, start: number, duration: number, volume = 0.8) => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        
        osc.type = "sine";
        
        // Add a triangle wave for more harmonics (sounds louder and more like a bell/chime)
        const osc2 = this.audioCtx!.createOscillator();
        osc2.type = "triangle";
        osc2.connect(gain);
        
        osc.frequency.setValueAtTime(freq, start);
        osc2.frequency.setValueAtTime(freq * 1.5, start); // Add a fifth harmonic
        
        // Envelope: strong attack, decay
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volume, start + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.start(start);
        osc2.start(start);
        osc.stop(start + duration);
        osc2.stop(start + duration);
      };

      // Play a beautiful, loud chime pattern (like a modern digital alarm or smart assistant)
      // Notes: C5, E5, G5, C6
      const baseFreqs = [523.25, 659.25, 783.99, 1046.50];
      
      for (let i = 0; i < 4; i++) { // Repeat the pattern 4 times
        const baseStart = now + i * 1.3;
        playTone(baseFreqs[0], baseStart, 0.8, 0.6);
        playTone(baseFreqs[1], baseStart + 0.15, 0.8, 0.6);
        playTone(baseFreqs[2], baseStart + 0.3, 0.8, 0.6);
        playTone(baseFreqs[3], baseStart + 0.45, 1.2, 0.8); // Louder on top note
      }
    } catch (err) {
      console.error("Alarm sound failed:", err);
    }
  }

  static async sendRealSMS(phones: string[], message: string) {
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ phones, message })
      });
      const data = await response.json();
      console.log("[AlarmService] Real SMS dispatch response:", data);
      return data;
    } catch (err: any) {
      console.error("[AlarmService] Failed to call SMS API:", err);
      return { error: true };
    }
  }

  static showNotification(title: string, body: string) {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        const options: any = {
          body: toPersianDigits(body),
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          vibrate: [1000, 500, 1000, 500, 1000, 500, 1000], // Strong vibration for notification
          requireInteraction: true, // Persist on screen until user interacts with it
          renotify: true, // Force ring/vibrate even if already showing
          tag: `alarm-${Date.now()}` // Unique tag to ensure it alerts
        };

        try {
          new Notification(toPersianDigits(title), options);
        } catch (err) {
          console.warn("[AlarmService] Failed to construct Notification directly, trying ServiceWorker fallback...", err);
          try {
            if ("serviceWorker" in navigator && navigator.serviceWorker) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(toPersianDigits(title), options);
              }).catch((swErr) => {
                console.error("[AlarmService] ServiceWorker showNotification failed too:", swErr);
              });
            }
          } catch(e) {}
        }
      }
      
      // Also trigger direct device vibration if the browser is focused
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate([1000, 500, 1000, 500, 1000]); } catch(e) {}
      }
    } catch(e) {}
  }
}
