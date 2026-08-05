(function () {
  const root = document.documentElement
  const interactiveSelector = [
    '#recent-posts > .recent-post-items > .recent-post-item',
    '#aside-content .card-widget',
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

  const cardSelector = '#recent-posts > .recent-post-items > .recent-post-item[data-post-link]'
  const interactiveChildSelector = 'a, button, input, select, textarea, label, [role="button"]'

  const openPostCard = (card, newTab = false) => {
    const link = card.dataset.postLink
    if (!link) return
    if (newTab) window.open(link, '_blank', 'noopener')
    else window.location.href = link
  }

  document.addEventListener('click', event => {
    if (event.button !== 0) return
    const card = event.target.closest(cardSelector)
    if (!card || event.target.closest(interactiveChildSelector)) return
    if (window.getSelection && window.getSelection().toString().trim()) return
    openPostCard(card, event.ctrlKey || event.metaKey)
  })

  document.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return
    const card = event.target.closest(cardSelector)
    if (!card || event.target !== card) return
    event.preventDefault()
    openPostCard(card, event.ctrlKey || event.metaKey)
  })
})()
