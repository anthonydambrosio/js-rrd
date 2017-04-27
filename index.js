

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
	return {
		start: Date.now(),
		samples: new Array( seconds( unit, amount ) ),
		index: 0,
		add: function( data ) {
			this.samples[this.index++] = { ts: Date.now(), data: data };
		},
		dump: function() {
			for ( i in this.samples ) {
				console.dir( i, null );
			}
		}
	}
}

var md = create( 'sec', 10 );
console.dir( md );
md.add( 1 );
md.add( 2 );
md.add( 3 );
md.dump();
