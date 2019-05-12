function makeBookmarksArray() {
    return[
        {
            id: 1,
            title: 'First test bookmark',
            body: 'Test Body',
            weburl: 'www.bookmark.com',
            rating: 1
        },
        {
            id: 2,
            title: 'Second test bookmark',
            body: 'Test Body Two',
            weburl: 'www.bookmark1.com',
            rating: 2
        },
        {
            id: 3,
            title: 'Third test bookmark',
            body: 'Test Body Three',
            weburl: 'www.bookmark2.com',
            rating: 3
        },
        {
            id: 4,
            title: 'Fourth test bookmark',
            body: 'Test Body Four',
            weburl: 'www.bookmark3.com',
            rating: 4
        },
    ];
}

function makeMaliciousBookmark() {
    const maliciousBookmark = {
      id: 911,
      title: 'Naughty naughty very naughty <script>alert("xss");</script>',
      weburl: 'https://www.hack.com',
      body: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
      rating: 1
    
    }
    const expectedBookmark = {
      ...maliciousBookmark,
      title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
      body: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    }
    return {
      maliciousBookmark,
      expectedBookmark,
    }
  }

module.exports = {
    makeBookmarksArray,
    makeMaliciousBookmark
}