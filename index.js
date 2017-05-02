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

function create( unit, amount ) {
	var start = Date.now(),
		samples = new Array( seconds( unit, amount ) ),
		index = 0;
	return {
		update: function( data ) {
			samples[index++] = { ts: Date.now(), data: data };
			index %= amount;
		},
		addData: function( cb, interval, seconds ) {
			var addfunc = function() {
				samples[index++] = { ts: Date.now(), data: cb() };
				index %= amount;
			};
			addfunc();
			var id = setInterval( addfunc, interval );
			if ( seconds )
				setTimeout( function() { clearInterval( id ) }, seconds * 1000 );
			return id;
		},
		dump: function() {
			for ( var i = 0; i < samples.length; i++ ) {
				console.dir( samples[i], { depth: null } );
			}
		}
	}
}

var jsrrd = create( 'min', 1 );
jsrrd.addData( os.cpus, 1000, 90 );

setTimeout( jsrrd.dump, 9000 );