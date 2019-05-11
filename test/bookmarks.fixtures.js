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

module.exports = {
    makeBookmarksArray,
}