(() => {
  // Key press event listener for triggering the leftmost emoji reaction
  const REACTION_LABELS = ['リアクション', 'Reactions']

  document.addEventListener('keydown', (event) => {
    // Check if the user is typing in an input or textarea element
    const activeElementTag = document.activeElement?.tagName
    if (activeElementTag === 'INPUT' || activeElementTag === 'TEXTAREA')
      return // Do nothing if the user is typing in an input or textarea

    if (event.key >= '1' && event.key <= '9') {
      // Use the REACTION_LABELS constant to find the emoji container
      const emojiContainer = document.querySelector(
        REACTION_LABELS.map(label => `div[aria-label="${label}"]`).join(', '),
      )
      const emojiButtons = emojiContainer?.querySelectorAll('button')
      const targetButton = emojiButtons?.[parseInt(event.key) - 1]
      if (targetButton)
        targetButton.click()
    }
  })
})()
