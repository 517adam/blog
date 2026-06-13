(function () {
  const root = document.documentElement
  const interactiveSelector = [
    '#recent-posts > .recent-post-items > .recent-post-item',
    '#aside-content .card-widget',
    '#post',
    '#page',
    '#archive',
    '#tag',
    '#category',
    '#pagination .page-number',
    '#pagination .extend',
    '#rightside > div > button'
  ].join(',')

  let queued = false
  let point = { x: 50, y: 16 }

  const paint = () => {
    root.style.setProperty('--liquid-glass-x', `${point.x}%`)
    root.style.setProperty('--liquid-glass-y', `${point.y}%`)
    queued = false
  }

  window.addEventListener('pointermove', event => {
    point = {
      x: Math.round((event.clientX / window.innerWidth) * 100),
      y: Math.round((event.clientY / window.innerHeight) * 100)
    }

    if (!queued) {
      queued = true
      requestAnimationFrame(paint)
    }
  }, { passive: true })

  document.addEventListener('pointerdown', event => {
    const target = event.target.closest(interactiveSelector)
    if (target) target.classList.add('liquid-glass-pressed')
  })

  document.addEventListener('pointerup', () => {
    document.querySelectorAll('.liquid-glass-pressed').forEach(item => {
      item.classList.remove('liquid-glass-pressed')
    })
  })

  document.addEventListener('pointercancel', () => {
    document.querySelectorAll('.liquid-glass-pressed').forEach(item => {
      item.classList.remove('liquid-glass-pressed')
    })
  })
})()
