(async () => {
    try {
        const containers = document.querySelectorAll('.x193iq5w[role="feed"]');
        const posts = [];

        for (const container of containers) {
            for (const child of container.children) {
                // Find the post URL element properly
                debugger
                const postUrlElement = Array.from(child.querySelectorAll('a[aria-label][role="link"]'))
                    .find(a => {
                        // Check if the link contains 'story_fbid' and 'id' in the URL, or videos
                        const url = new URL(a.href);
                        const hasStoryFbid = url.searchParams.has('story_fbid');
                        const hasId = url.searchParams.has('id');
                        const hasVideo = url.pathname.includes('/videos/');
                        const hasPost = url.pathname.includes('/posts/');
                        const hasReels = url.pathname.includes('/reels/');
                        return (hasPost) || (hasStoryFbid && hasId) || hasVideo || hasReels;
                    });

                let postUrl = null;
                if (postUrlElement) {
                    const url = new URL(postUrlElement.href);
                    const storyFbid = url.searchParams.get('story_fbid');
                    const id = url.searchParams.get('id');
                    if (storyFbid && id) {
                        url.search = `?story_fbid=${storyFbid}&id=${id}`;
                        postUrl = url.toString();
                    }
                    else if (url.pathname.includes('/posts/')) {
                        const postId = url.pathname.split('/').pop();
                        url.search = `?id=${postId}`;
                        postUrl = url.toString();
                    }
                }

                // Try finding profile name immediately
                let profileNameContainer = child.querySelector('[data-ad-rendering-role="profile_name"]');
                if (!profileNameContainer) {
                    child.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    profileNameContainer = child.querySelector('[data-ad-rendering-role="profile_name"]');
                }

                // Find profile link
                const profileLinkElement = child.querySelector('div[data-ad-rendering-role="profile_name"] a');
                let profileLink = null;
                if (profileLinkElement) {
                    const url = new URL(profileLinkElement.href);
                    const id = url.searchParams.get('id');
                    url.search = id ? `?id=${id}` : '';
                    profileLink = url.toString();
                }

                // Find post message
                const messageElement = child.querySelector('[data-ad-rendering-role="story_message"]');
                const images = Array.from(child.getElementsByTagName('img')).map(img => img.src);

                posts.push({
                    postUrl,
                    profileLink,
                    profileName: profileNameContainer ? profileNameContainer.innerText.trim() : null,
                    message: messageElement ? messageElement.innerText.trim() : null,
                    images
                });
            }
        }

        console.log(posts);
        return posts;
    } catch (err) {
        console.error('Error:', err);
        return null;
    }
})();
