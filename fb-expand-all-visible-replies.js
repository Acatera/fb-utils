const buttons = Array.from(document.querySelectorAll('div[role="button"]'))
  .filter(e =>
    e.textContent.includes("Replies") ||
    e.textContent.includes("replied") ||
    e.textContent.includes("View all") ||
    e.textContent.includes("View 1 reply")
  );

buttons.forEach((el, i) => {
  setTimeout(() => {
    const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
    if (key && el[key]?.onClick) {
      el[key].onClick({
        type: 'click',
        nativeEvent: new MouseEvent('click'),
        currentTarget: el,
        target: el,
        stopPropagation() {},
        preventDefault() {}
      });
    } else {
      console.warn('No React onClick found for element:', el);
    }
  }, i * 100); // 100ms between each click
});
