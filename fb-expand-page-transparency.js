(() => {
    const delayBetweenClicks = 1000;
    const result = {
        transparencyStatus: 'Not found',
        seeMoreStatus: 'Not found',
        historyEntries: [],
        adsStatus: [],
        pageManagers: []
    };

    const triggerReactClick = (element) => {
        const reactKey = Object.keys(element).find(key => key.startsWith('__reactProps$'));
        if (reactKey) {
            const props = element[reactKey];
            if (typeof props.onClick === 'function') {
                const mockEvent = {
                    preventDefault: () => {},
                    stopPropagation: () => {},
                    nativeEvent: {
                        preventDefault: () => {},
                        stopImmediatePropagation: () => {}
                    }
                };
                props.onClick(mockEvent);
                return true;
            }
        }
        return false;
    };

    // Step 1: Click \'See all transparency information\'
    const transparencyBtn = document.querySelector('[role=\'button\'][aria-label=\'See all transparency information\']');
    if (transparencyBtn) {
        triggerReactClick(transparencyBtn);
        result.transparencyStatus = 'Clicked';
    }

    // Step 2: Delay and then try clicking \'See * More\'
    setTimeout(() => {
        const allButtons = document.querySelectorAll('[role=\'button\'][aria-label]');
        for (const btn of allButtons) {
            const label = btn.getAttribute('aria-label');
            if (/^See \d+ More$/.test(label)) {
                triggerReactClick(btn);
                result.seeMoreStatus = `Clicked: ${label}`;
                break;
            }
        }

        // Step 3: Delay again before scanning content
        setTimeout(() => {
            const spanElements = Array.from(document.querySelectorAll('span'));

            // --- HISTORY SECTION ---
            const historySpan = spanElements.find(el => el.textContent.trim() === 'History');
            if (historySpan) {
                let container = historySpan;
                for (let i = 0; i < 5; i++) {
                    if (!container.parentElement) break;
                    container = container.parentElement;
                }

                const section = container?.nextElementSibling;
                if (section) {
                    const children = Array.from(section.children);
                    children.forEach((child) => {
                        const text = child.innerText?.trim();
                        if (
                            text &&
                            !/^See less$/i.test(text) &&
                            !/^See more$/i.test(text) &&
                            !/^See \d+ More$/i.test(text)
                        ) {
                            result.historyEntries.push(text);
                        }
                    });
                }
            }

            // --- ADS SECTION ---
            const adMessages = [
                'is not currently running ads',
                'has run ads about'
            ];

            const adTextTargets = document.querySelectorAll('body, body *');
            adTextTargets.forEach(el => {
                const text = el.textContent?.trim();
                if (text) {
                    adMessages.forEach(msg => {
                        if (
                            text.startsWith('This') &&
                            text.includes(msg) &&
                            !result.adsStatus.includes(text)
                        ) {
                            result.adsStatus.push(text);
                        }
                    });
                }
            });

            // --- PEOPLE WHO MANAGE SECTION ---
            const managerSpan = spanElements.find(el =>
                el.textContent.trim().startsWith('People who manage this ')
            );

            if (managerSpan) {
                let managerContainer = managerSpan;
                for (let i = 0; i < 5; i++) {
                    if (!managerContainer.parentElement) break;
                    managerContainer = managerContainer.parentElement;
                }

                const siblings = Array.from(managerContainer?.parentElement?.children || [])
                    .filter(el => el !== managerContainer);

                siblings.forEach(el => {
                    const text = el.innerText?.trim();
                    if (text) {
                        result.pageManagers.push(text);
                    }
                });
            }

            // --- FINAL OUTPUT ---
            console.log('--- Final JSON Result ---');
            console.log(JSON.stringify(result, null, 2));
            return result;

        }, delayBetweenClicks); // Inner delay for content rendering

    }, delayBetweenClicks); // First delay for transparency click
})();
