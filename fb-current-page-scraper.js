(async () => {
    try {
        // Scroll to the top of the page to load all posts
        window.scrollTo(0, 0);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the page to load

        const posts = [];
        const parsedArticles = new Set();
        const targetCount = 50; // <-- how many posts you want to scrape
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        while (posts.length < targetCount) {
            const articles = document.querySelectorAll('div[role="article"]');

            for (const article of articles) {
                if (parsedArticles.has(article)) continue;
                parsedArticles.add(article);

                const postUrlElement = Array.from(article.querySelectorAll('a[aria-label][role="link"]'))
                    .find(a => {
                        try {
                            const url = new URL(a.href);
                            return url.hostname.includes('facebook.com') && (
                                url.pathname.includes('/posts/') ||
                                url.pathname.includes('/permalink.php') ||
                                url.pathname.includes('/videos/') ||
                                url.pathname.includes('/story.php')
                            );
                        } catch {
                            return false;
                        }
                    });

                let postUrl = null;
                let postDate = null;
                if (postUrlElement) {
                    try {
                        const url = new URL(postUrlElement.href);

                        // Remove useless query parameters except story_fbid and id if available
                        const storyFbid = url.searchParams.get('story_fbid');
                        const id = url.searchParams.get('id');

                        if (storyFbid && id) {
                            url.search = `?story_fbid=${storyFbid}&id=${id}`;
                        } else {
                            url.search = ''; // Otherwise, strip all query params
                        }

                        postUrl = url.toString();


                        // Extract the date and time from the postUrlElement
                        // There are a few formats: "1h", "1d", "April 10 at 9:45 AM"
                        // Result must be normalized to a Date object
                        const dateTime = postUrlElement.getAttribute('aria-label');
                        console.log('dateTime:', dateTime);
                        if (dateTime) {
                            const dateTimeParts = dateTime.split(' at ');
                            const now = new Date();
                            if (dateTimeParts.length > 1) {
                                const datePart = dateTimeParts[0].trim();
                                const timePart = dateTimeParts[1].trim();

                                // Assume current year if year missing
                                const fullDateString = `${datePart} ${now.getFullYear()} ${timePart}`;
                                postDate = new Date(fullDateString);

                                // Check if postDate is in the future (wrong assumption about year rollover)
                                if (postDate > now) {
                                    postDate.setFullYear(postDate.getFullYear() - 1); // Go back one year if needed
                                }
                            } else {
                                const timeAgoMatch = dateTime.match(/^(\d+)([a-zA-Z]+)$/);
                                if (timeAgoMatch) {
                                    const value = parseInt(timeAgoMatch[1], 10);
                                    const unit = timeAgoMatch[2].toLowerCase();
                                    let milliseconds = 0;
                                    if (unit.startsWith('m')) {
                                        milliseconds = value * 60 * 1000; // minutes
                                    }
                                    else if (unit.startsWith('h')) {
                                        milliseconds = value * 60 * 60 * 1000; // hours
                                    } else if (unit.startsWith('d')) {
                                        milliseconds = value * 24 * 60 * 60 * 1000; // days
                                    }
                                    postDate = new Date(Date.now() - milliseconds);
                                } else {
                                    postDate = null; // Unknown format, skip
                                }
                            }
                        }
                    } catch {
                        postUrl = null;
                    }
                }

                const messageElement = article.querySelector('[data-ad-rendering-role="story_message"]');
                const images = Array.from(article.getElementsByTagName('img')).map(img => img.src);
                if (!messageElement) {
                    continue;
                }

                posts.push({
                    postUrl,
                    postDate,
                    message: messageElement ? messageElement.innerText.trim() : null,
                    images
                });

                if (posts.length >= targetCount) {
                    break;
                }
            }

            window.scrollBy(0, window.innerHeight);
            await delay(1000);

            // Output the number of posts scraped so far
            console.log(`Scraped ${posts.length} posts...`);
        }

        console.log(posts);
        return posts;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
})();
