const os = require( 'os' );

function seconds( unit, amount ) {
	return ({
		sec: 1,
		min: 60,
		hr: 3600,
		day: 86400,
		week: 604800,
		default: 1
	}[unit] || 1) * (amount || 1);
}


function create( unit, count, func ) {
	var result = new Array( count ).fill( 0 );
		interval = seconds( unit ) * 1000,
		index = 0,
		// Data functions.
		dataFunc = {
			// Count the number of times the update function
			// was called for the period.
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
			// Sum the data for the period.
			sum : {
				total: 0,
				update: function( data ) {
					this.total += data;
				},
				result: function() {
					var total = this.total;
					this.total = 0;
					return { ts: Math.floor( Date.now() / 1000 ), value: total };
				}
			},
			// Average the data for the period.
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
					var value = count == 0 ? 0.0 : total / count;
					return { ts: Math.floor( Date.now() / 1000 ), value: value };
				}
			}
		}[func || 'sum'],
		increment = function() {
			console.log( 'increment: ' + index );
			if ( index < result.length ) {
				result[ index ] = dataFunc.result();
				index += 1;
			} else {
				result.push( dataFunc.result() );
				result.shift();
			}
		};
		var iid = setInterval( increment, interval );
	return {
		update: function( data ) {
			dataFunc.update( data );
		},
		dump: function() {
			console.dir( result, { depth: null } );
		},
		fetch: function() {
			return result;
		},
		stop: function() {
			clearInterval( iid );
		}
	}
}

var jsrrd = create( 'min', 3, 'count' );

var updateFunc = function() {
	var mem = os.freemem();
	jsrrd.update( mem );
};

var display = function() {
	var r = jsrrd.fetch();
	console.log( "Result" );
	console.dir( r, { depth: null } );
}

setInterval( updateFunc, 500 );
setInterval( jsrrd.dump, 1000 );
setInterval( jsrrd.stop, 61000 );
setInterval( display, 90000)