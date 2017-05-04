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

/*
	Create a RRD object.

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
function create( unit, count, func ) {
	var buckets = new Array( count ).fill( 0 );	// The buckets.
		interval = seconds( unit ) * 1000,		// Amount of time to fill current bucket in seconds.
		index = 0,								// Current bucket index in buckets array.
		// Bucket functions.
		// If not supplied return count function.
		dataFunc = {
			// Count the number of times the update function
			// was called for the period.
			// Essentially a counter.
			count: {
				value: 0,
				update: function( data ) {
					this.value++;
				},
				result: function() {
					var value = this.value;
					this.value = 0;
					return value;
				}
			},
			// Return the last value that was supplied to
			// the update function.
			last: {
				value: 0,
				update: function( data ) {
					this.value = data;
				},
				result: function() {
					return this.value;
				}
			},
			// Sum the data for the bucket period.
			sum : {
				total: 0,
				update: function( data ) {
					this.total += data;
				},
				result: function() {
					var total = this.total;
					this.total = 0;
					return total;
				}
			},
			// Average the data for the bucket period.
			avg : {
				total: 0.0,
				count: 0,
				update: function( data ) {
					this.total += data;
					this.count++;
				},
				result: function() {
					var total = this.total;
					var count = this.count;
					this.total = 0.0;
					this.count = 0;
					return count == 0 ? 0.0 : total / count;
				}
			}
		}[func || 'count'], // return count fucntion if not supplied.
		/*
			Calculate the current bucket value using the configured function.
			Increment to the next bucket if not on last bucket, or
			shift left all buckets and append latest bucket.
		*/
		increment = function() {
			if ( index < buckets.length ) {
				buckets[ index ] = { ts: Math.floor( Date.now() / 1000 ), value: dataFunc.result() };
				index += 1;
			} else {
				buckets.push( { ts: Math.floor( Date.now() / 1000 ), value: dataFunc.result() } );
				buckets.shift();
			}
		};
		// Set the interval for calling the increment function.
		var iid = setInterval( increment, interval );
	// Return the interface.
	return {
		// Add data to the current bucket.
		update: function( data ) {
			dataFunc.update( data );
		},
		// Dump to console all the buckets.
		dump: function() {
			console.dir( buckets, { depth: null } );
		},
		// Fetch the buckets.
		fetch: function() {
			return buckets;
		},
		// Stop incrementing current bucket.
		stop: function() {
			clearInterval( iid );
		}
	}
}
