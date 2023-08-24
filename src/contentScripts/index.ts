(() => {
  const REACTION_LABELS = ['リアクション', 'Reactions']

  function addNumberToEmoji() {
    const emojiContainer = document.querySelector(
      REACTION_LABELS.map(label => `div[aria-label="${label}"]`).join(', '),
    )
    const emojiButtons = emojiContainer?.querySelectorAll('button')

    if (emojiButtons) {
      emojiButtons.forEach((button, index) => {
        // Check if the number is already added
        const existingNumber = button.querySelector('.emoji-number-label')
        if (existingNumber)
          existingNumber.remove()

        // Create a new number element
        const numberElement = document.createElement('span')
        numberElement.textContent = `${index + 1}`
        numberElement.classList.add('emoji-number-label')

        // Apply styles
        const buttonSize = button.getBoundingClientRect()
        const numberSize = buttonSize.width / 3

        const COMMON_STYLE = {
          position: 'absolute',
          bottom: '0',
          right: '0',
          width: `${numberSize}px`,
          height: `${numberSize}px`,
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '50%',
          textAlign: 'center',
          lineHeight: `${numberSize}px`,
          fontSize: `${numberSize * 0.6}px`, // Adjust font size based on number size
        }

        Object.assign(numberElement.style, COMMON_STYLE)

        // Append the number to the button
        button.style.position = 'relative'
        button.appendChild(numberElement)
      })
    }
  }

  // Rest of the code remains the same

  // 監視の対象となるノードを選択
  const targetNode = document.body

  // 監視のオプション
  const config = {
    childList: true,
    subtree: true,
  }

  // コールバック関数
  const callback: MutationCallback = function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      if (mutation.type === 'childList') {
        observer.disconnect() // 監視を一時停止
        addNumberToEmoji()
        observer.observe(targetNode, config) // 監視を再開
      }
    }
  }

  // MutationObserverをインスタンス化
  const observer = new MutationObserver(callback)

  // 監視を開始
  observer.observe(targetNode, config)

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
