## js-rrd

A Javascript in memory Round Robin Database (RRD).

Inspired by rrdtool but not quite the same.

### Install

npm install js-rrd

### API

function create( timeUnits, count, bucketFunction )

	timeUnits - Time units of each bucket.
		Valid values:
			sec
			min
			hr
			day
			week

	count - Number of buckets of each timeUnit.

	bucketFunction - Function applied to data added to bucket.
		Current functions:
			count - Count each time bucket is updated.
			last - Last value written to bucket.
			sum - Sum of all values written to bucket.
			avg - Average of all values written to bucket.

function update( data )

	data - Data to add to current bucket.

function fetch()

	Return array of buckets.

function stop()

	Stop incrementing to next bucket when timeUnit ends.

### Example
```js
// Create a DB
// Use 1 second buckets for 10 seconds, sum all data added.
const jsrrd = require( 'js-rrd' );

var sixtySecondSums = jsrrd.create( 'sec', 10, 'sum' );
console.dir( sixtySecondSums.update );

// Add data to the RRD.
sixtySecondSums.update( 10 );
sixtySecondSums.update( 20 );
sixtySecondSums.update( 30 );

// After 2 seconds fetch the RRD and display it.
setTimeout( function() {
	// Get the last 10 seconds of the RRD.
	var now = sixtySecondSums.fetch();

	// Display it.
	console.dir( now );
	sixtySecondSums.stop();
}, 2000 );