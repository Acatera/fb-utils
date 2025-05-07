function clickReactByTextSequence(items, delay = 500) {
    let i = 0;
    function clickNext() {
      if (i >= items.length) return;
  
      const [selector, text] = items[i++];
      const el = Array.from(document.querySelectorAll(selector))
        .find(e => e.textContent.includes(text));
      if (!el) return console.warn(`Element "${text}" not found`);
  
      const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
      if (!key || !el[key]?.onClick) return console.warn(`React onClick for "${text}" not found`);
  
      el[key].onClick({
        type: 'click',
        nativeEvent: new MouseEvent('click'),
        currentTarget: el,
        target: el,
        stopPropagation() {},
        preventDefault() {}
      });
  
      setTimeout(clickNext, delay);
    }
  
    clickNext();
  }
  
  // Example usage:
  clickReactByTextSequence([
    ['div[aria-haspopup="menu"][role="button"]', 'Most relevant'],
    ['[role="menuitem"]', 'All comments']
  ], 800);