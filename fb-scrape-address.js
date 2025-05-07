(() => {
    // Step 1: find the span with label text `Address`
    const label = Array.from(document.querySelectorAll('span'))
        .find(el => el.textContent.trim() === 'Address');

    if (!label) return null;

    // Step 2: go up and find the nearest preceding <span dir=`auto`>
    const addressSpan = label.closest('div')?.parentElement?.previousElementSibling?.querySelector('span[dir=\'auto\']');
    const address = addressSpan ? addressSpan.textContent.trim() : null;

    console.log(address);
    return address;
})();

