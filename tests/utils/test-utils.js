const fs = require('fs');
const path = require('path');

function loadPage(site, page) {
    document.documentElement.innerHTML = fs.readFileSync(
        path.resolve(__dirname, `../pages/${site}/${page}`),
        'utf8'
    );
}

module.exports = {
    loadPage,
}
