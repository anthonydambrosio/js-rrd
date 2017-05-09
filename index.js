/*
	js-rrd
	A javascript in-memory Round-Robin Database inspired by rrdtool but
	not exactly the same.
*/


/*
	Calculate the total number of seconds in
	N units of time.
*/
function seconds( unit, amount ) {
	return ({
		sec: 1,			// Seconds
		min: 60,		// Minutes
		hr: 3600,		// Hours
		day: 86400,		// Days
		week: 604800,	// Weeks
		default: 1		// Default to seconds.
	}[unit] || 1) * (amount || 1); // Default amount to 1.
}

// Count the number of times the update function
// was called for the period.
// Essentially a counter.
function Count() {
	var value = 0;
	this.update = function( data ) {
		this.value++;
	}
	this.result = function() {
		var value = this.value;
		this.value = 0;
		return value;
	}
}

// Return the last value that was supplied to
// the update function.
function Last() {
	var value = 0;
	this.update = function( data ) {
		this.value = data;
	}
	this.result = function() {
		return this.value;
	}
}

// Sum the data for the bucket period.
function Sum() {
	var total = 0;
	this.update = function( data ) {
		this.total += data;
	}
	this.result = function() {
		var total = this.total;
		this.total = 0;
		return total;
	}
}

// Average the data for the bucket period.
function Avg() {
	var total = 0.0,
	count = 0;
	this.update = function( data ) {
		this.total += data;
		this.count++;
	}
	this.result = function() {
		var total = this.total;
		var count = this.count;
		this.total = 0.0;
		this.count = 0;
		return count == 0 ? 0.0 : total / count;
	}
}

/*
	RRD constructor function.

	The object contains a ordered collection of buckets.  Each bucket has a timestamp
	and a value.  Values are calculated by the configured function.  Buckets can have
	data added to them at any time.  Once the configured period has elapsed the bucket
	value is calculated and the next bucket is used.  If all the buckets are filled the
	oldest bucket will be removed and a new bucket appended to the end.

	Arguments
		unit : Number of seconds a bucket is active.
		count : Number of buckets.
		func : Function to apply to bucket when unit has expired.
*/

module.exports = function RRD( unit, count, func ) {
	this.buckets = new Array( count ).fill( 0 );	// The buckets.
	this.interval = seconds( unit ) * 1000;		// Amount of time to fill current bucket in seconds.
	this.index = 0;								// Current bucket index in buckets array.
	this.iid = null;
	// Bucket functions.
	// If not supplied return count function.
	this.dataFunc = {
		count: new Count(),
		// Return the last value that was supplied to
		// the update function.
		last: new Last(),
		// Sum the data for the bucket period.
		sum : new Sum(),
		// Average the data for the bucket period.
		avg : new Avg()
	}[ func || 'count' ]; // return count fucntion if not supplied.
	/*
		Calculate the current bucket value using the configured function.
		Increment to the next bucket if not on last bucket, or
		shift left all buckets and append latest bucket.
	*/
	this.increment = function() {
		if ( this.index < this.buckets.length ) {
			this.buckets[ this.index ] = { ts: Math.floor( Date.now() / 1000 ), value: this.dataFunc.result() };
			this.index += 1;
		} else {
			this.buckets.push( { ts: Math.floor( Date.now() / 1000 ), value: this.dataFunc.result() } );
			this.buckets.shift();
		}
	}
	// Add data to the current bucket.
	this.update = function( data ) {
		this.dataFunc.update( data );
	}
	// Dump to console all the buckets.
	this.dump = function() {
		console.dir( this.buckets, { depth: null } );
	}
	// Fetch the buckets.
	this.fetch = function() {
		return this.buckets;
	}
	// Stop incrementing current bucket.
	this.stop = function() {
		this.increment();
		clearInterval( this.iid );
	}
	// Set the interval for calling the increment function.
	this.iid = setInterval( this.increment.bind( this ), this.interval );
}
