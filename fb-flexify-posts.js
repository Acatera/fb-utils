(() => {
  const feed = document.querySelector('[role="feed"]');
  if (!feed) {
    console.error('Feed not found!');
    return;
  }

  // Walk up the DOM and widen all parent containers
  let parent = feed.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (
      style.maxWidth !== 'none' ||
      style.width !== 'auto' ||
      style.margin === '0 auto' ||
      style.transform !== 'none' ||
      style.zoom !== 'normal'
    ) {
      Object.assign(parent.style, {
        maxWidth: '100%',
        width: '100%',
        margin: '0',
        transform: 'none',
        zoom: '100%',
      });
    }
    parent = parent.parentElement;
  }

  // Set up flex layout for feed
  Object.assign(feed.style, {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    justifyContent: 'center', // <--- CHANGED from 'flex-start'
    padding: '10px'
  });


  // Set post/article sizing
  const articles = feed.querySelectorAll('[role="article"]');
  articles.forEach(article => {
    Object.assign(article.style, {
      flex: '0 1 200px',
      maxWidth: '300px',
      maxHeight: '250px',
      boxSizing: 'border-box',
      margin: '0'
    });
    const imgContainers = article.querySelectorAll('div img');
    imgContainers.forEach(wrapper => {
      const container = wrapper.parentElement;
      if (container) {
        container.style.overflow = 'hidden';
        container.style.maxHeight = '200px';
        container.style.maxWidth = '100%';
        container.style.objectFit = 'cover'; // <--- CHANGED from 'contain'
      }
    });
  });

  console.log('Zoomed out and fully expanded.');
})();
