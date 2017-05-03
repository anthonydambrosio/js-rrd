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


function create( unit, count, interval ) {
	var result = new Array( count ).fill( 0 );
		interval = interval,
		index = 0,
		sum = {
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
		avg = {
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
		},
		operation = avg,
		increment = function() {
			result[ index ] = operation.result();
			if ( index < result.length-1 )
				index += 1;
			else
				index = 0;
		};
		var iid = setInterval( increment, interval );
	return {
		update: function( data ) {
			operation.update( data );
		},
		dump: function() {
			console.dir( result, { depth: null } );
		},
		snapshot: fucntion() {
			return result;
		}
		stop: function() {
			clearInterval( iid );
		}
	}
}

var jsrrd = create( 'sec', 30, 10000 );

var getMem = function() {
	var mem = os.freemem();
	jsrrd.update( mem );
};

setInterval( getMem, 1000 );
setInterval( jsrrd.dump, 5000 );
setTimeout( jsrrd.stop, 35000 );

