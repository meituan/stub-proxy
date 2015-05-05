var fs = require('fs'),
    path = require('path'),
    request = require('supertest'),
    mount = './test/fixtures',
    app = require('../index')(mount);

describe('index', function() {
    it('should return mock data', function(done) {
        var fixture = fs.readFileSync(path.join(mount, 'deal/:id.POST.json'), 'utf8');
        fixture = JSON.parse(fixture);

        request(app)
            .post('/deal/1234')
            .expect(200)
            .end(function(err, res) {
                (err === null).should.be.true;
                res.body.should.eql(fixture.body);
                done();
            });
    });

    it('should handle mock data not found error', function(done) {
        request(app)
            .get('/shop/1234')
            .expect(404)
            .end(function(err, res) {
                (err === null).should.be.true;
                res.text.should.be.ok;
                done();
            });
    });

    it('should Content-Length return byte length', function(done) {
        var json = JSON.parse(fs.readFileSync(path.join(mount, 'deal/:id.POST.json'), 'utf8'));
        var content = JSON.stringify(json.body);
        request(app)
            .post( '/deal/1234')
            .expect(200)
            .expect('Content-Length', Buffer.byteLength(content, 'utf8'))
            .end(function(err) {
                (err === null).should.be.true;
                done();
            });
    });

    it('should handle invalid mock data', function(done) {
        request(app)
            .get('/')
            .expect(500)
            .end(function(err) {
                (err === null).should.be.true;
                done();
            });
    });
});
