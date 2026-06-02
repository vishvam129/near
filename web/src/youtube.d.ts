// Minimal ambient typing for the YouTube IFrame API (loaded at runtime).
interface Window {
  YT?: {
    Player: new (el: HTMLElement | string, opts: unknown) => YTPlayer
    PlayerState: { PLAYING: number; PAUSED: number; ENDED: number }
  }
  onYouTubeIframeAPIReady?: () => void
}
interface YTPlayer {
  loadVideoById: (id: string, startSeconds?: number) => void
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  getCurrentTime: () => number
  getVideoData: () => { video_id: string }
  destroy: () => void
}
