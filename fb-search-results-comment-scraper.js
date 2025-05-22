const postsData = [];
let comments = [];
const STEP_DELAY_MS = 800;
const POST_DELAY_MS = 1000;

function log(...args) {
    console.log('[🔍 SCRAPER]', ...args);
}

function getCurrentPost() {
    const feed = document.querySelector('.x193iq5w[role="feed"]');
    if (!feed) {
        log('❌ Feed not found');
        return null;
    }

    return feed.children[0] || null;
}

function consumePost(post) {
    if (!post) return;
    post.remove();
    log('✅ Post consumed');
}

function simulateReactClick(element) {
    const key = Object.keys(element).find(k => k.startsWith('__reactProps$'));
    if (!key || typeof element[key]?.onClick !== 'function') {
        log('❌ No React onClick for element:', element);
        return false;
    }

    element[key].onClick({
        type: 'click',
        nativeEvent: new MouseEvent('click'),
        currentTarget: element,
        target: element,
        stopPropagation() {},
        preventDefault() {}
    });

    log('✅ React click simulated on element');
    return true;
}

function waitForDialogToLoad(callback) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const dialog = node.getAttribute('role') === 'dialog'
                        ? node
                        : node.querySelector('[role="dialog"]');

                    if (dialog) {
                        observer.disconnect();

                        const checkLoaded = setInterval(() => {
                            const visible = dialog.offsetHeight > 0;
                            const hasContent = dialog.querySelector('div[data-ad-rendering-role="story_message"]');
                            if (visible && hasContent) {
                                clearInterval(checkLoaded);
                                log('✅ Dialog content loaded');
                                callback(dialog);
                            }
                        }, 100);

                        return;
                    }
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    log('⏳ Waiting for dialog to load...');
}

function hidePostMessage(callback = null) {
    const dialog = document.querySelector('[role="dialog"]');
    if (!dialog) {
        log('❌ Dialog not found when trying to hide post message');
        if (callback) callback();
        return;
    }

    log('⏳ Scanning for possible post message nodes...');
    const message = dialog.querySelector('div[data-ad-rendering-role="story_message"]');

    if (message) {
        message.style.display = 'none';
        log('✅ Post message hidden');
    } else {
        log('⚠️ No post message found — may be media-only or too short');
    }

    if (callback) callback();
}

function runSortLogic(callback) {
    log('🧭 Sorting comments...');

    function clickReactByTextSequence(items, delay = 500) {
        let i = 0;
        function clickNext() {
            if (i >= items.length) {
                log('✅ Comment sort complete');
                if (callback) callback();
                return;
            }
            const [selector, text] = items[i++];
            const el = Array.from(document.querySelectorAll(selector))
                .find(e => e.textContent.includes(text));
            if (!el) {
                log(`❌ Element "${text}" not found`);
                clickNext();
                return;
            }
            const key = Object.keys(el).find(k => k.startsWith('__reactProps$'));
            if (!key || !el[key]?.onClick) {
                log(`❌ React onClick for "${text}" not found`);
                clickNext();
                return;
            }
            el[key].onClick({
                type: 'click',
                nativeEvent: new MouseEvent('click'),
                currentTarget: el,
                target: el,
                stopPropagation() {},
                preventDefault() {}
            });
            log(`✅ Clicked "${text}"`);
            setTimeout(clickNext, delay);
        }
        clickNext();
    }

    clickReactByTextSequence([
        ['div[aria-haspopup="menu"][role="button"]', 'Most relevant'],
        ['[role="menuitem"]', 'All comments']
    ], 800);
}

function openPostAndScrapeComments(post, nextCallback) {
    const postUrlElement = Array.from(post.querySelectorAll('a[aria-label][role="link"]'))
        .find(a => {
            const url = new URL(a.href);
            return url.pathname.includes('/posts/') || url.searchParams.has('story_fbid');
        });

    if (!postUrlElement) {
        log('❌ Post URL not found');
        nextCallback();
        return;
    }

    const success = simulateReactClick(postUrlElement);
    if (!success) {
        log('❌ Could not click post URL element');
        nextCallback();
        return;
    }

    waitForDialogToLoad(() => {
        log('📥 Dialog loaded. Scraping comments...');

        setTimeout(() => {
            hidePostMessage(() => {
                setTimeout(() => {
                    runSortLogic(() => {
                        setTimeout(() => {
                            scrapeComments(() => {
                                setTimeout(() => {
                                    closeDialogIfOpen();
                                    consumePost(post);
                                    setTimeout(nextCallback, POST_DELAY_MS);
                                }, STEP_DELAY_MS);
                            });
                        }, STEP_DELAY_MS);
                    });
                }, STEP_DELAY_MS);
            });
        }, STEP_DELAY_MS);
    });
}

// ---------------------------------
// Comment Scraping Logic
// ---------------------------------

let commentEmptyChecks = 0;
const MAX_EMPTY_CHECKS = 10;

function consumeComment(comment) {
    comments.push(comment.innerText.trim());
    const parent = comment.closest('div:not([class])');
    if (parent) parent.remove();

    if (comments.length % 10 === 0) {
        log(`📊 Processed ${comments.length} comments`);
    }
}

function getNextComment() {
    return document.querySelector('div[role="dialog"] div[aria-label^="Comment"][role="article"]');
}

function scrapeComments(callback) {
    // comments = [];
    
    commentEmptyChecks = 0;

    function processNextComment() {
        const comment = getNextComment();
        if (!comment) {
            if (commentEmptyChecks++ < MAX_EMPTY_CHECKS) {
                setTimeout(processNextComment, 500);
            } else {
                log('✅ Finished processing comments');
                log(comments);
                callback();
            }
            return;
        }

        commentEmptyChecks = 0;

        const seeMore = Array.from(comment.querySelectorAll('div[role="button"]'))
            .find(btn => {
                const text = btn.textContent.trim();
                return text === 'See more' || text === 'Afișează mai mult';
            });

        if (!seeMore) {
            consumeComment(comment);
            setTimeout(processNextComment, 200);
            return;
        }

        const key = Object.keys(seeMore).find(k => k.startsWith('__reactProps$'));
        if (!key || typeof seeMore[key]?.onClick !== 'function') {
            log('⚠️ No React onClick for See more button');
            consumeComment(comment);
            setTimeout(processNextComment, 200);
            return;
        }

        const observer = new MutationObserver(() => {
            observer.disconnect();
            consumeComment(comment);
            setTimeout(processNextComment, 200);
        });

        observer.observe(comment, {
            childList: true,
            subtree: true,
            characterData: true
        });

        seeMore[key].onClick({
            type: 'click',
            nativeEvent: new MouseEvent('click'),
            currentTarget: seeMore,
            target: seeMore,
            stopPropagation() {},
            preventDefault() {}
        });

        log('🔽 Expanded "See more" in comment');
    }

    processNextComment();
}

function closeDialogIfOpen() {
    const closeButton = document.querySelector('div[role="dialog"] [aria-label="Close"]');
    if (!closeButton) {
        log('⚠️ Close button not found');
        return;
    }

    const key = Object.keys(closeButton).find(k => k.startsWith('__reactProps$'));
    if (key && typeof closeButton[key]?.onClick === 'function') {
        closeButton[key].onClick({
            type: 'click',
            nativeEvent: new MouseEvent('click'),
            currentTarget: closeButton,
            target: closeButton,
            stopPropagation() {},
            preventDefault() {}
        });
        log('❎ Dialog closed via React click');
    } else {
        closeButton.click();
        log('❎ Dialog closed via native click');
    }
}

// ---------------------------------
// Master Post Processor
// ---------------------------------

function processNextPost() {
    const post = getCurrentPost();
    if (!post) {
        log('✅ No more posts to process');
        return;
    }

    log('▶️ Processing new post...');
    openPostAndScrapeComments(post, processNextPost);
}

// ✅ Start the full process
processNextPost();
