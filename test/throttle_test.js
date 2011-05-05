var vows = require('vows'),
    assert = require('assert'),
    zeromq = require('../zeromq');

var suite = vows.describe('ZeroMQ');
suite.options.error = false;
suite.addBatch({
  "RECV Throttling": {
    works: function() {
      var uri = 'inproc://throttled';
      var sO = zeromq.createSocket("push");
      var sI = zeromq.createSocket("pull");
      sI.setThrottle(5);

      var touchie = [];
      var count = 1;
      sI.on('message', function() {
        touchie.push(count++);

        if (sI.isBeingThrottled())
          touchie.push(true);

        if (count == 6) {   // when blocked
          setTimeout(function(){ touchie.push("timeout"); sI.recvComplete(5); }, 1);
        } else if (count > 6) {
          sI.recvComplete();
        }

        if (count == 11) {
          sO.close();
          sI.close();

          assert.equal(touchie[0], 1);
          assert.equal(touchie[1], 2);
          assert.equal(touchie[2], 3);
          assert.equal(touchie[3], 4);
          assert.equal(touchie[4], 5);
          assert.equal(touchie[5], true);
          assert.equal(touchie[6], "timeout");
          assert.equal(touchie[7], 6);
          assert.equal(touchie[8], 7);
          assert.equal(touchie[9], 8);
          assert.equal(touchie[10], 9);
          assert.equal(touchie[11], 10);
        }
      })

      sI.bind(uri, function(){
        sO.connect(uri)
        for (var i=0; i < 10; i++) {
          sO.send(""+i);
        };
      })
    },
    "didn't break anything": function() {
      var uri = 'inproc://unthrottled';
      var sO = zeromq.createSocket("push");
      var sI = zeromq.createSocket("pull");
      // sI.setThrottle(5);

      var touchie = [];
      var count = 1;
      sI.on('message', function() {
        touchie.push(count++);

        if (sI.isBeingThrottled())
          touchie.push(true);

        if (count == 6) {   // not actually blocked
          setTimeout(function(){ touchie.push("timeout"); sI.recvComplete(5); }, 1);
        } else if (count > 6) {
          sI.recvComplete();
        }

        if (count == 11) {
          setTimeout(function(){
            sO.close();
            sI.close();

            assert.equal(touchie[0], 1);
            assert.equal(touchie[1], 2);
            assert.equal(touchie[2], 3);
            assert.equal(touchie[3], 4);
            assert.equal(touchie[4], 5);
            assert.equal(touchie[5], 6);
            assert.equal(touchie[6], 7);
            assert.equal(touchie[7], 8);
            assert.equal(touchie[8], 9);
            assert.equal(touchie[9], 10);
            assert.equal(touchie[10], "timeout");
          }, 2);
        }
      })

      sI.bind(uri, function(){
        sO.connect(uri)
        for (var i=0; i < 10; i++) {
          sO.send(""+i);
        };
      })
    }
  }
})
suite.export(module);
