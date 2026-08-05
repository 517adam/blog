(function () {
  'use strict'

  if (window.blogMusicPlayerLoaded) return
  window.blogMusicPlayerLoaded = true

  const script = document.currentScript
  const playlistUrl = script && script.dataset.playlist ? script.dataset.playlist : '/music/playlist.json'
  const icons = {
    play: 'fas fa-play', pause: 'fas fa-pause', previous: 'fas fa-backward-step', next: 'fas fa-forward-step',
    volume: 'fas fa-volume-high', muted: 'fas fa-volume-xmark', list: 'fas fa-list-ul', collapse: 'fas fa-chevron-left', music: 'fas fa-music'
  }
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char])
  const formatTime = seconds => {
    if (!Number.isFinite(seconds)) return '0:00'
    return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
  }
  const button = (className, label, icon) => `<button class="music-button ${className}" type="button" aria-label="${label}" title="${label}"><i class="${icon}" aria-hidden="true"></i></button>`

  const init = async () => {
    if (document.getElementById('blog-music-player')) return
    let tracks = []
    try {
      const response = await fetch(playlistUrl, { cache: 'no-cache' })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      tracks = (await response.json()).filter(track => track && track.url)
    } catch (error) {
      console.error('[music-player] Unable to load playlist:', error)
    }

    const player = document.createElement('section')
    player.id = 'blog-music-player'
    player.setAttribute('aria-label', '博客音乐播放器')
    player.innerHTML = `
      <div class="music-player-shell">
        <div class="music-player-main">
          <div class="music-cover" role="button" tabindex="0" aria-label="展开播放器"><i class="${icons.music}" aria-hidden="true"></i></div>
          <div class="music-track-info"><div class="music-title">${tracks.length ? '选择一首音乐' : '播放列表为空'}</div><div class="music-artist">${tracks.length ? `${tracks.length} 首曲目` : '请检查 playlist.json'}</div></div>
          <div class="music-controls">${button('music-previous', '上一首', icons.previous)}${button('music-toggle', '播放', icons.play)}${button('music-next', '下一首', icons.next)}</div>
        </div>
        <div class="music-progress-row"><span class="music-current">0:00</span><input class="music-range music-progress" type="range" min="0" max="100" value="0" step="0.1" aria-label="播放进度"><span class="music-duration">0:00</span></div>
        <div class="music-extras">${button('music-mute', '静音', icons.volume)}<input class="music-range music-volume" type="range" min="0" max="1" value="0.72" step="0.01" aria-label="音量">${button('music-list-toggle', '播放列表', icons.list)}</div>
        <ol class="music-playlist" aria-label="播放列表"></ol>
      </div>
      ${button('music-collapse', '收起播放器', icons.collapse)}
    `
    document.body.appendChild(player)

    const audio = new Audio()
    audio.preload = 'metadata'
    const storedVolume = Number(localStorage.getItem('blog-music-volume'))
    audio.volume = Number.isFinite(storedVolume) ? Math.min(1, Math.max(0, storedVolume)) : 0.72
    const elements = {}
    ;['cover', 'title', 'artist', 'toggle', 'previous', 'next', 'progress', 'current', 'duration', 'mute', 'volume', 'list-toggle', 'playlist', 'collapse'].forEach(name => {
      elements[name.replace('-', '')] = player.querySelector(`.music-${name}`)
    })

    let currentIndex = Math.min(Number(localStorage.getItem('blog-music-track')) || 0, Math.max(0, tracks.length - 1))
    let seeking = false
    let loaded = false
    elements.volume.value = audio.volume
    elements.volume.style.setProperty('--range-progress', `${audio.volume * 100}%`)

    const updatePlayButton = () => {
      const playing = !audio.paused
      player.classList.toggle('music-player-playing', playing)
      elements.toggle.innerHTML = `<i class="${playing ? icons.pause : icons.play}" aria-hidden="true"></i>`
      elements.toggle.setAttribute('aria-label', playing ? '暂停' : '播放')
      elements.toggle.title = playing ? '暂停' : '播放'
    }
    const renderPlaylist = () => {
      elements.playlist.innerHTML = tracks.map((track, index) => `<li><button type="button" data-track="${index}" aria-current="${index === currentIndex}"><span class="music-playlist-index">${index === currentIndex && !audio.paused ? '<i class="fas fa-volume-low"></i>' : index + 1}</span><span class="music-playlist-name">${escapeHtml(track.title || `曲目 ${index + 1}`)}</span><span class="music-playlist-artist">${escapeHtml(track.artist || '')}</span></button></li>`).join('')
    }
    const loadTrack = index => {
      if (!tracks.length) return
      currentIndex = (index + tracks.length) % tracks.length
      const track = tracks[currentIndex]
      audio.src = track.url
      loaded = true
      elements.title.textContent = track.title || `曲目 ${currentIndex + 1}`
      elements.artist.textContent = track.artist || '未知艺术家'
      player.style.setProperty('--music-accent', track.color || '#6b8cff')
      elements.progress.value = 0
      elements.progress.style.setProperty('--range-progress', '0%')
      elements.current.textContent = '0:00'
      elements.duration.textContent = '0:00'
      localStorage.setItem('blog-music-track', currentIndex)
      renderPlaylist()
    }
    const play = async () => {
      if (!tracks.length) return
      if (!loaded) loadTrack(currentIndex)
      try { await audio.play() } catch (error) { console.warn('[music-player] Playback was prevented:', error) }
      updatePlayButton()
    }
    const changeTrack = async direction => {
      const wasPlaying = !audio.paused
      loadTrack(currentIndex + direction)
      if (wasPlaying) await play()
    }

    elements.toggle.addEventListener('click', () => audio.paused ? play() : audio.pause())
    elements.previous.addEventListener('click', () => changeTrack(-1))
    elements.next.addEventListener('click', () => changeTrack(1))
    elements.listtoggle.addEventListener('click', () => {
      const open = player.classList.toggle('music-playlist-open')
      elements.listtoggle.setAttribute('aria-expanded', String(open))
    })
    elements.playlist.addEventListener('click', event => {
      const item = event.target.closest('[data-track]')
      if (!item) return
      const selected = Number(item.dataset.track)
      if (selected === currentIndex && loaded) audio.paused ? play() : audio.pause()
      else { loadTrack(selected); play() }
    })

    const setCollapsed = collapsed => {
      player.classList.toggle('music-player-collapsed', collapsed)
      elements.collapse.setAttribute('aria-label', collapsed ? '展开播放器' : '收起播放器')
      elements.collapse.title = collapsed ? '展开播放器' : '收起播放器'
      localStorage.setItem('blog-music-collapsed', String(collapsed))
    }
    elements.collapse.addEventListener('click', () => setCollapsed(!player.classList.contains('music-player-collapsed')))
    elements.cover.addEventListener('click', () => { if (player.classList.contains('music-player-collapsed')) setCollapsed(false) })
    elements.cover.addEventListener('keydown', event => {
      if ((event.key === 'Enter' || event.key === ' ') && player.classList.contains('music-player-collapsed')) { event.preventDefault(); setCollapsed(false) }
    })

    elements.progress.addEventListener('input', () => {
      seeking = true
      const ratio = Number(elements.progress.value) / 100
      elements.progress.style.setProperty('--range-progress', `${elements.progress.value}%`)
      elements.current.textContent = formatTime(audio.duration * ratio)
    })
    elements.progress.addEventListener('change', () => {
      if (Number.isFinite(audio.duration)) audio.currentTime = audio.duration * (Number(elements.progress.value) / 100)
      seeking = false
    })
    elements.volume.addEventListener('input', () => {
      audio.volume = Number(elements.volume.value)
      audio.muted = false
      elements.volume.style.setProperty('--range-progress', `${audio.volume * 100}%`)
      localStorage.setItem('blog-music-volume', audio.volume)
    })
    elements.mute.addEventListener('click', () => { audio.muted = !audio.muted })

    audio.addEventListener('play', () => { updatePlayButton(); renderPlaylist() })
    audio.addEventListener('pause', () => { updatePlayButton(); renderPlaylist() })
    audio.addEventListener('ended', () => { loadTrack(currentIndex + 1); play() })
    audio.addEventListener('loadedmetadata', () => { elements.duration.textContent = formatTime(audio.duration) })
    audio.addEventListener('timeupdate', () => {
      if (seeking || !Number.isFinite(audio.duration)) return
      const progress = (audio.currentTime / audio.duration) * 100 || 0
      elements.progress.value = progress
      elements.progress.style.setProperty('--range-progress', `${progress}%`)
      elements.current.textContent = formatTime(audio.currentTime)
    })
    audio.addEventListener('volumechange', () => {
      const muted = audio.muted || audio.volume === 0
      elements.mute.innerHTML = `<i class="${muted ? icons.muted : icons.volume}" aria-hidden="true"></i>`
      elements.mute.setAttribute('aria-label', muted ? '取消静音' : '静音')
      elements.mute.title = muted ? '取消静音' : '静音'
    })
    audio.addEventListener('error', () => { elements.artist.textContent = '音频加载失败，请尝试下一首'; updatePlayButton() })

    setCollapsed(localStorage.getItem('blog-music-collapsed') === 'true')
    renderPlaylist()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true })
  else init()
})()
