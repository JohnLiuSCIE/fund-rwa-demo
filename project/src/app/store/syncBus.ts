const CHANNEL_NAME = "fund_demo.sync.v2";

type SyncListener = () => void;

export class SyncBus {
  private channel?: BroadcastChannel;
  private listener?: (event: StorageEvent) => void;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
    }
  }

  publish() {
    if (this.channel) {
      this.channel.postMessage({ ts: Date.now() });
      return;
    }

    localStorage.setItem(CHANNEL_NAME, String(Date.now()));
  }

  subscribe(onSync: SyncListener) {
    if (this.channel) {
      const fn = () => onSync();
      this.channel.addEventListener("message", fn);
      return () => this.channel?.removeEventListener("message", fn);
    }

    this.listener = (event: StorageEvent) => {
      if (event.key === CHANNEL_NAME) {
        onSync();
      }
    };

    window.addEventListener("storage", this.listener);
    return () => {
      if (this.listener) {
        window.removeEventListener("storage", this.listener);
      }
    };
  }

  destroy() {
    this.channel?.close();
    if (this.listener) {
      window.removeEventListener("storage", this.listener);
    }
  }
}
