const express = require('express')
const uuid = require('uuid/v4')
const logger = require('../src/logger')
const { bookmarks } = require('../src/store')
const { isWebUri } = require('valid-url')
const xss = require('xss')
const BookmarksService = require('../src/bookmarks-service')
const bookmarkRouter = express.Router()
const bodyParser = express.json()

const serializedBookmark = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    body: xss(bookmark.body),
    weburl: bookmark.weburl,
    rating: Number(bookmark.rating)
})

bookmarkRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
            .then(bookmarks => {
                res.json(bookmarks.map(serializedBookmark))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { title, body, weburl, rating } = req.body;

    if(!title) {
        logger.error(`Title is required`);
        return res 
            .status(400)
            .send({
                error: { message: `Missing 'title' in request` }
            })
    }

    if(!body) {
        logger.error(`Description is required`);
        return res 
            .status(400)
            .send({
                error: { message: `Missing 'body' in request` }
            })
    }

    if(!weburl) {
        logger.error(`Url is required`);
        return res 
            .status(400)
            .send({
                error: { message: `Missing 'weburl' in request` }
            })
    }

    if (!Number.isInteger(rating) || rating < 0 || rating > 5 ){
        logger.error(`Invalid rating of ${rating} given`)
        return res
            .status(400)
            .send({
                error: { message: `'rating', rating must be between 0-5`}
            })
    }

    if (!isWebUri(weburl)) {
        logger.error(`Invalid url of ${weburl} given`)
        return res
            .status(400)
            .send( `url must be a valid URL`)
    }

    const bookmark = {
        title,
        body,
        weburl,
        rating
    };

    BookmarksService.insertBookmark(
        req.app.get('db'),
        bookmark
      )
        .then(bookmark => {
          logger.info(`Bookmark with id ${bookmark.id} created.`)
          res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(serializedBookmark(bookmark))
        })
        .catch(next)
    })


    bookmarkRouter
        .route('/bookmarks/:id')
        .get((req, res, next) => {
            const { id } = req.params;
            const bookmark = bookmarks.find(b => b.id == id);
        BookmarksService.getById(req.app.get('db'), id)
            .then(bookmark => {
                if(!bookmark) {
                    logger.error(`Bookmark with id:${id} not found.`);
                    return res 
                    .status(404)
                    .send({ error: { message: `Bookmark doesn't exist` } })
            }
            res.json(serializedBookmark(bookmark))
        })
            .catch(next)
    })
        .delete((req, res) => {
            const { id } = req.params;
            const bookmarkIndex = bookmarks.findIndex(b => b.id == id)

            if(bookmarkIndex === -1) {
                logger.error(`Bookmark with id: ${id} not found`);
                return res
                    .status(404)
                    .send('Not found')
            }

            bookmarks.splice(bookmarkIndex, 1);

            logger.info(`Bookmark with id:${id} deleted`);
            res
                .status(204)
                .end();
            })

    module.exports = bookmarkRouter