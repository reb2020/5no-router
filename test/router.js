const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')
const Router = require('../index')

const app = express()

const schema = {
  id: {
    type: Number,
    defaultValue: null,
    required: true,
  },
}

app.use(Router({
  path: '/test',
  actions: [
    {
      path: '/',
      method: 'GET',
      handler: (req, res) => res.action.success('yap'),
    },
    {
      path: '/',
      method: 'POST',
      handler: (req, res) => res.action.success('yap - post'),
    },
  ],
}))

app.use(Router({
  path: '/content',
  actions: [
    {
      path: '/:id',
      method: 'GET',
      schema: schema,
      handler: (req, res) => res.action.success(req.action.data.id),
    },
    {
      path: '/',
      method: 'POST',
      schema: schema,
      handler: (req, res) => res.action.success(req.action.data.id),
    },
  ],
}))

app.use(Router({
  path: '/failed',
  actions: [
    {
      path: '/',
      method: 'PUT',
      schema: schema,
      handler: (req, res) => res.action.success(req.action.data.id),
    },
  ],
}))

const server = app.listen(1291)

const should = chai.should()

chai.use(chaiHttp)

describe('Router', () => {
  beforeEach((done) => {
    done()
  })

  after((done) => {
    server.close(done)
  })

  describe('OPTIONS', () => {
    it('success return data', (done) => {
      chai.request(app)
        .options('/test')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })

    it('success return data with parameters', (done) => {
      chai.request(app)
        .options('/content')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })
  })

  describe('GET', () => {
    it('success return data', (done) => {
      chai.request(app)
        .get('/test')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          res.body.should.have.property('message').eql('yap')
          done()
        })
    })

    it('success return data with parameters', (done) => {
      chai.request(app)
        .get('/content/123')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          res.body.should.have.property('message').eql(123)
          done()
        })
    })

    it('failed', (done) => {
      chai.request(app)
        .get('/failed')
        .end((err, res) => {
          res.should.have.status(405)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })

    it('failed with parameters', (done) => {
      chai.request(app)
        .get('/failed/1233')
        .end((err, res) => {
          res.should.have.status(405)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })
  })

  describe('POST', () => {
    it('success return data', (done) => {
      chai.request(app)
        .post('/test')
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          res.body.should.have.property('message').eql('yap - post')
          done()
        })
    })

    it('success return data with parameters', (done) => {
      chai.request(app)
        .post('/content')
        .send({
          id: 123,
        })
        .end((err, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          res.body.should.have.property('message').eql(123)
          done()
        })
    })

    it('error return data with parameters', (done) => {
      chai.request(app)
        .post('/content')
        .end((err, res) => {
          res.should.have.status(400)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          res.body.should.have.property('message').eql({ id: ['id is required'] })
          done()
        })
    })

    it('failed', (done) => {
      chai.request(app)
        .post('/failed')
        .end((err, res) => {
          res.should.have.status(405)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })

    it('failed with parameters', (done) => {
      chai.request(app)
        .post('/failed/1233')
        .end((err, res) => {
          res.should.have.status(405)
          res.body.should.be.a('object')
          res.body.should.have.property('status')
          res.body.should.have.property('success')
          res.body.should.have.property('message')
          done()
        })
    })
  })
})
