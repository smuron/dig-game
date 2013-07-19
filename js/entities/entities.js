// TODO

game.PlayerEntity = me.SpriteObject.extend({

	// boolean, can the player currently move?
	// disabled when animating or already moving
	init: function(x, y) {
		this.gridPos = {
			x: x,
			y: y
		}
        // call the constructor
        this.parent((x+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, (y+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE, me.loader.getImage('player'));
        // set the default horizontal & vertical speed (accel vector)
        this.anchorPoint.set(0.5,0.5);

        this.hp = 20;
        this.mood = 0; // TODO
        this.scanCount = 3;

        this.canInput = true;

        // set the display to follow our position on both axis
        //me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    doMove: function(dx,dy) {
    	//console.log("doMove to",dx,dy);
    	this.canInput = false;
    	var nextObj = null;
    	var scan = null;
    	if (dx > -1 && dx < game.map.gridWidth && dy > -1 && dy < game.map.gridHeight) {
    		nextObj = game.map.entityGrid[dx][dy].pop();
    	}
    	if (!nextObj) {
    		// start moving
    		this.gridPos.x = dx;
    		this.gridPos.y = dy;
    		var tween = new me.Tween(this.pos).to({x: (dx+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, y: (dy+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE}, 200)
    			.onComplete(this.moveDone.bind(this,1));
    		tween.easing(me.Tween.Easing.Quadratic.EaseInOut);
    		tween.start();
    	} else {
    		// something is in the way, either dig it or
    		// give invalidKey feedback
    		
    		if (nextObj.className == 'scanresult' || nextObj.className == 'scanfail') {
    			// save the scanresult and replace it with whatever it was on top of
    			scan = nextObj;
    			scan.poke(); // change to less obtrusive sprite
    			nextObj = game.map.entityGrid[dx][dy].pop();
    		}
    		
    		// attempt to dig / activate
    		if (nextObj && nextObj.touch(this)) {
    			console.log('touch is true',nextObj,scan);
    			// if true, then add it back to the array
    			game.map.entityGrid[dx][dy].push(nextObj);
    			if (scan) {
    				game.map.entityGrid[dx][dy].push(scan);
    			}
    		} else {
    			console.log('touch is false',nextObj,scan);
    			// we dug it, remove scan result if nothing else is there
    			if (scan && game.map.entityGrid[dx][dy].length > 0) {
    				// something is there, put it back
    				game.map.entityGrid[dx][dy].push(scan);
    			} else if (scan) {
    				// remove the scan result
    				scan.touch();

    			}
    		}
    	}
    },

    moveDone: function(moveCost) {
    	me.game.HUD.updateItemValue('moves',moveCost); // caller determines move cost
    	this.canInput = true;
    },

    invalidKey: function() {
    	// play sound / animation
    },

    update: function() {
    	// if we're already digging or
    	// otherwise can't move, don't bother checking
    	if (this.canInput) {
    		// check to make sure we don't move off field, then do stuff
	    	if (me.input.isKeyPressed('left')) {
	    		if (this.gridPos.x > 0) {
	    			this.doMove(this.gridPos.x-1,this.gridPos.y);
	    		}
	    	} else if (me.input.isKeyPressed('right')) {
	    		if (this.gridPos.x < game.map.gridWidth-1) {
	    			this.doMove(this.gridPos.x+1,this.gridPos.y);	
	    		}
	    	} else if (me.input.isKeyPressed('up')) {
	    		if (this.gridPos.y > 0) {
	    			this.doMove(this.gridPos.x,this.gridPos.y-1);
	    		}
	    	} else if (me.input.isKeyPressed('down')) {
	    		if (this.gridPos.y < game.map.gridHeight-1) {
	    			this.doMove(this.gridPos.x,this.gridPos.y+1);
	    		}
	    	} else if (me.input.isKeyPressed('space') && this.scanCount > 0) {
	    		// normally, do an animation.
	    		this.scanCount--;
	    		var scanObj;
	    		if (this.gridPos.x > 0) {
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x-1,this.gridPos.y,0);
	    			me.game.add(scanObj,4);
	    		}
	    		if (this.gridPos.x < game.map.gridWidth-1) {
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x+1,this.gridPos.y,1);
	    			me.game.add(scanObj,4);
	    		}
	    		if (this.gridPos.y > 0) {
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x,this.gridPos.y-1,2);
	    			me.game.add(scanObj,4);
	    		}
	    		if (this.gridPos.y < game.map.gridHeight-1) {
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x,this.gridPos.y+1,3);
	    			me.game.add(scanObj,4);
	    		}
	    		this.moveDone(8);
	    		me.game.sort();
	    	}
    	}
		//this.updateMovement();

    	this.parent();
    	return true;
    }

});

game.boxmuller = function() {
	var x = 0, y = 0, r, c;
	do {
		x = Math.random()*2-1;
		y = Math.random()*2-1;
		r = x*x + y*y;
	} while (r == 0 || r > 1)

	c = Math.sqrt(-2*Math.log(r)/r);

	return [x*c, y*c];
}

game.rand_dist = function(mu0, sigma0, mu1, sigma1) {
	// generate numbers from a normal distribution
	var std = game.boxmuller();
	//console.log(std);
	std[0] = Math.round(std[0]*sigma0+mu0);
	std[1] = Math.round(std[1]*sigma1+mu1);
	return std;
}

// static hash of grid spaces
game.GRID = {
	ORIGIN: {
		X: 2,
		Y: 2
	},
	TILE_SIZE: 16,
	NOTHING: -1,
	DIRT_EMPTY: 0,
	DIRT_GEM: 1,
	HOIST: 2,
	DIRT2_EMPTY: 3,
	DIRT2_GEM: 4
}

game.MapHandler = function() {
	// instance members

	// game grid
	this.grid = null;
	this.entityGrid = null;
	this.gridWidth = -1;
	this.gridHeight = -1;

	// number of dirt tiles undug
	this.dirtLeft = -1;

	// number of gems left in map
	this.gemsLeft = -1;
	return this;
};
game.MapHandler.prototype.generateMap = function(w,h,diffFactor,seed) {
	if (seed) {
		Math.seedrandom(seed, false);
	} else {
		// reseed so last seed doesn't affect random numbers
		Math.seedrandom();
	}
	// generate a random w x h map

	// initialize the grid first
	// this allows us to use any strategy when generating 
	// random grids instead of requiring us to iterate
	// generate new arrays
	this.grid = new Array(w);
	this.entityGrid = new Array(w);
	for (var i = 0; i < w; i++) {
		this.grid[i] = new Array(h);
		this.entityGrid[i] = new Array(h);
		for (var j = 0; j < h; j++) {
			this.grid[i][j] = game.GRID.DIRT_EMPTY;
		}
	}
	// grid array setup done; set members
	this.gridWidth = w;
	this.gridHeight = h;
	game.GRID.ORIGIN.X = Math.round(((640 / game.GRID.TILE_SIZE) - w) / 2);
	game.GRID.ORIGIN.Y = Math.round(((480 / game.GRID.TILE_SIZE) - h) / 2);
	// now do some generation

	// generate a random gemCount
	// rounded value of w+h/2 plus random * minimum of w and h
	var gemCount = Math.round((w+h)/2+Math.min(w,h));
	var dirt2Count = Math.floor(Math.min(w*h*0.85,diffFactor*Math.min(w,h))); // go for it

	// set counters
	this.dirtLeft = w*h; // will change if we have non-dirt spaces
	this.gemsLeft = gemCount;
	me.game.HUD.setItemValue('gems', gemCount);

	// set std distribution values
	// 95% of values will lie on grid
	var wMu = (w-1)/2;
	var wSigma = (wMu)*0.5;
	var hMu = (h-1)/2;
	var hSigma = (hMu)*0.5;

	var startX = Math.round(wMu);
	var startY = Math.round(hMu);
	// create the hoist at wMu,hMu, rounded
	this.grid[startX][startY] = game.GRID.HOIST;
	// put player start on a random square next to it
	switch(Math.floor(Math.random()*4)) {
		case 0:
			startX--;
			break;
		case 1:
			startX++;
			break;
		case 2:
			startY--;
			break;
		case 3:
			startY++
			break;
	}
	// don't spawn anything on player
	this.grid[startX][startY] = game.GRID.NOTHING;
	// finish adding the player object
	if (game.player1) {
		me.game.remove(game.player1);
	}
	game.player1 = me.entityPool.newInstanceOf('player',startX,startY);
	me.game.add(game.player1,2);

	// TODO - abstract these loops
	while (gemCount > 0) {
		// TODO - generate different kinds of gems?
		var coords = game.rand_dist(wMu, wSigma, hMu, hSigma); // Array(2) of random std dist
		//console.log(coords);
		// throw out anything that's out of bounds
		if (coords[0] < 0 || coords[0] >= w || coords[1] < 0 || coords[1] >= h) {
			continue;
		}
		if (this.grid[coords[0]][coords[1]] != 0) {
			continue; // already put something here
		}
		this.grid[coords[0]][coords[1]] = game.GRID.DIRT_GEM;
		gemCount--;
	}
	while (dirt2Count > 0) {
		// TODO - generate different kinds of gems?
		var coords = game.rand_dist(wMu, wSigma, hMu, hSigma); // Array(2) of random std dist
		//console.log(coords);
		// throw out anything that's out of bounds
		if (coords[0] < 0 || coords[0] >= w || coords[1] < 0 || coords[1] >= h) {
			continue;
		}
		// if a gem is in this spot, cover it
		if (this.grid[coords[0]][coords[1]] === game.GRID.DIRT_GEM) {
			this.grid[coords[0]][coords[1]] = game.GRID.DIRT2_GEM;
			dirt2Count--;
		} else if (this.grid[coords[0]][coords[1]] === game.GRID.DIRT_EMPTY) {
			this.grid[coords[0]][coords[1]] = game.GRID.DIRT2_EMPTY;
			dirt2Count--;
		}
		// else space is taken already, continue.
		
	}
	
}
game.MapHandler.prototype.populateLevel = function() {
	for (var i = 0; i < this.gridWidth; i++) {
		var x = (game.GRID.ORIGIN.X + i)*game.GRID.TILE_SIZE;
		for (var j = 0; j < this.gridHeight; j++) {
			var y = (game.GRID.ORIGIN.Y + j)*game.GRID.TILE_SIZE;
			switch(this.grid[i][j]) {
				case game.GRID.DIRT_EMPTY:
					var dirt = me.entityPool.newInstanceOf("dirt",x,y);
					me.game.add(dirt,3);
					this.entityGrid[i][j] = [dirt];
					break;
				case game.GRID.DIRT_GEM:
					var dirt = me.entityPool.newInstanceOf("dirt",x,y);
					var gem = me.entityPool.newInstanceOf('gem',x,y);
					me.game.add(gem,2);
					me.game.add(dirt,3);
					this.entityGrid[i][j] = [gem,dirt];
					break;
				case game.GRID.HOIST:
					var hoist = me.entityPool.newInstanceOf('hoist',x,y);
					me.game.add(hoist,3);
					this.entityGrid[i][j] = [hoist];
					break;
				case game.GRID.DIRT2_EMPTY:
					var dirt = me.entityPool.newInstanceOf("dirt2",x,y);
					me.game.add(dirt,3);
					this.entityGrid[i][j] = [dirt];
					break;
				case game.GRID.DIRT2_GEM:
					var dirt = me.entityPool.newInstanceOf("dirt2",x,y);
					var gem = me.entityPool.newInstanceOf('gem',x,y);
					me.game.add(gem,2);
					me.game.add(dirt,3);
					this.entityGrid[i][j] = [gem,dirt];
					break;
				case game.GRID.NOTHING:
					this.entityGrid[i][j] = [];
					break;
				default:
					console.log('derp');
					this.entityGrid[i][j] = [];
					break;
			}
		}
	}
}

game.GemEntity = me.SpriteObject.extend({
	
	init: function(x, y) {
		this.parent(x, y, me.loader.getImage("gem"));
		this.anchorPoint.set(0.5,0.5);

		// entity that is picking us up
		this.toucher = null;
		this.gemValue = 1;
		//this.digs = 1;
		//this.maxDigs = 1;
	},

	touch: function(from) {
		// sanity check
		if (!this.toucher) {
			// notate who removed this object
			this.toucher = from;
			this.flicker(9);
			this.z = 10;
			me.game.sort();
			var secondTween = new me.Tween(this).to({alpha: 0.0}, 500).onComplete(this.afterTween.bind(this));
			var firstTween = new me.Tween(this.scale).to({x: 3.0, y: 3.0}, 200).onComplete(this.afterTween2.bind(this));
			//var firstTween = new me.Tween(this.scale).delay(150).to(, 500).chain(secondTween);
			this.scaleFlag = true;
			firstTween.easing(me.Tween.Easing.Sinusoidal.EaseInOut);
			secondTween.easing(me.Tween.Easing.Sinusoidal.EaseInOut);
			firstTween.start();
			secondTween.start();
		}
	},

	afterTween2: function() {
		this.toucher.moveDone(1);
	},

	afterTween: function() {
		// notify toucher that we're done animating
		me.game.HUD.updateItemValue('gems',-this.gemValue);
		me.game.remove(this);
	},

	update: function() {
		this.parent();
		return true;
	}
});

game.DirtEntity = me.SpriteObject.extend({

	init: function(x, y, img) {
		this.parent(x, y, img ? img : me.loader.getImage("dirt1"));
		this.anchorPoint.set(0.5,0.5);
		//this.setOpacity(0.4);

		// entity that is digging us
		this.toucher = null;

		// number of digs required to get rid of this
		this.digs = 1;
		this.maxDigs = 1;
	},

	touch: function(from) {
		// sanity check
		if (!this.toucher) {
			// notate who removed this object
			this.toucher = from;
			this.scaleFlag = true;
			var firstTween = new me.Tween(this.scale);
			if (--this.digs <= 0) {
				// dug all the way through
				firstTween.to({x: 0.125, y: 0.125}, 200).onComplete(this.afterTween.bind(this));
				firstTween.start();
				return false;
			} else {
				// still goin'
				var secondTween = new me.Tween(this.scale).to({x: 1.0, y: 1.0}, 100).onComplete(this.afterTween.bind(this));
				firstTween.to({x: 0.75, y: 0.75}, 100).chain(secondTween);
				firstTween.start();
				return true;
			}
			
		}
	},

	afterTween: function() {
		// notify toucher that we're done animating
		if (this.digs <= 0) {
			me.game.remove(this);
		} else {
			this.scaleFlag = false;
			//console.log(this.image,me.loader.getImage('dirt1'));
			this.image = me.loader.getImage("dirt"+this.digs);
		}
		this.toucher.moveDone(2);
		this.toucher = null;
	},

	update: function() {
		this.parent();
		return true;
	}
});

game.Dirt2Entity = game.DirtEntity.extend({

	init: function(x, y) {
		this.parent(x, y, me.loader.getImage("dirt2"));
		// set digs
		this.maxDigs = 2;
		this.digs = 2;
	}

});

game.HoistEntity = me.SpriteObject.extend({
	
	init: function(x, y) {
		this.parent(x, y, me.loader.getImage("hoist"));
		this.anchorPoint.set(0.5,0.5);
	},

	touch: function(from) {
		if (me.game.HUD.getItemValue('gems') === 0) {
    		// level transition
    		// goto next level
    		me.levelDirector.reloadLevel();
    	} else {
    		from.moveDone(0); // don't allow move
    		return true;
    	}
	},

	update: function() {
		this.parent();
		return true;
	}
});


// Entity that wanders around and looks for stuff
game.ScanEntity = me.SpriteObject.extend({
	init: function(x, y, dir, from) {
		this.gridPos = {
			x: x,
			y: y
		};
		this.parent((x+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, (y+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE, me.loader.getImage("scanner"));
		this.anchorPoint.set(0.5,0.5);

		this.toucher = from;
		this.energy = 4;
		this.walkDir = dir;
		this.walkEnergy = 1; // when does it stop moving in one direction?
		this.walked = []; // don't waste energy on the same thing
		this.nextScan(); // start scanning
	},

	nextScan: function() {
		// do things in current cell before moving
		var i = 0, ii = this.walked.length;
		for (; i < ii; i++) {
			if (this.walked[i].x == this.gridPos.x && this.walked[i].y == this.gridPos.y) {
				// been here done that
				//console.log("found scan result in history!",this.gridPos);
				break;
			}
		}
		if (i === ii) {
			//console.log("didn't found scan result in history!",this.gridPos);
			// didn't find that node in the list, add it and subtract energy
			var newPos = {
				x: this.gridPos.x,
				y: this.gridPos.y
			};
			this.walked.push(newPos); // clone
			// scan tile, get total cost + find out if we need to create a result
			var egrid = game.map.entityGrid[this.gridPos.x][this.gridPos.y];
			var cost = 0, found = false, scanned = false;
			for (var i = 0, ii = egrid.length; i < ii; i++) {
				console.log(egrid[i]);
				if (egrid[i].digs) {
					cost += egrid[i].digs;
				}
				if (egrid[i].gemValue) {
					found = true;
				}
				if (egrid[i].className === 'scanresult' || egrid[i].className === 'scanfail') {
					scanned = true;
				}
			}
			// create result entity + push it
			if (!scanned) {
				var scanResult = null;
				if (found) {
					scanResult = me.entityPool.newInstanceOf('scanresult',this.pos.x,this.pos.y);
				} else if (egrid.length > 0) {
					scanResult = me.entityPool.newInstanceOf('scanfail',this.pos.x,this.pos.y);
				}
				if (scanResult) {
					me.game.add(scanResult,7);
					egrid.push(scanResult);
					me.game.sort();
				}
				if (cost) {
					this.energy -= 1; //cost; // via digs
				}
			}
		}
		
		if (this.energy <= this.walkEnergy) {
			// move in a random direction
			this.walkDir = Math.floor(Math.random()*4);
		}
		switch(this.walkDir) {
			case 0:
				if (this.gridPos.x > 0) {
					this.gridPos.x--;
				} else {
					// we hit an edge, so allow turning
					this.walkEnergy = this.energy;
				}
				break;
			case 1:
				if (this.gridPos.x < game.map.gridWidth-1) {
					this.gridPos.x++;
				} else {
					// we hit an edge, so allow turning
					this.walkEnergy = this.energy;
				}
				break;
			case 2:
				if (this.gridPos.y > 0) {
					this.gridPos.y--;
				} else {
					// we hit an edge, so allow turning
					this.walkEnergy = this.energy;
				}
				break;
			case 3:
				if (this.gridPos.y < game.map.gridHeight-1) {
					this.gridPos.y++;
				} else {
					// we hit an edge, so allow turning
					this.walkEnergy = this.energy;
				}
				break;
		}
		// remove object if out of energy
		if (this.energy <= 0) {
			me.game.remove(this);
			return;
		}
		// animate with tween
		var tween = new me.Tween(this.pos).to({x: (this.gridPos.x+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, y: (this.gridPos.y+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE}, 250)
    			.onComplete(this.nextScan.bind(this));
		tween.easing(me.Tween.Easing.Cubic.EaseInOut);
		tween.start();
	},

	update: function() {
		this.parent();
		return true;
	}
});

game.ScanResult = me.SpriteObject.extend({

	init: function(x, y) {
		this.parent(x,y,me.loader.getImage("scan"));
	},

	touch: function() {
		me.game.remove(this);
	},

	poke: function() {
		this.image = me.loader.getImage("scan2");
	}

});

game.FailResult = me.SpriteObject.extend({
	init: function(x, y) {
		this.parent(x,y,me.loader.getImage("scanfail"));
	},

	touch: function() {
		me.game.remove(this);
	},

	poke: function() {
		; //this.image = me.loader.getImage("scan2");
	}
})
//
//
// Game HUD Stuff
//
//

game.zfill = function(x,len) {
	x = x.toString();
	while (x.length < len) x = "0"+x;
	return x;
}

game.MoveCounter = me.HUD_Item.extend({

	init: function(x,y) {
		this.parent(x,y);
	},

	draw: function(context, x, y) {
		game.font.draw(context, "MOVES: "+game.zfill(this.value,4), this.pos.x+x, this.pos.y+y);
	}
});
game.GemCounter = me.HUD_Item.extend({

	once: true,
	init: function(x,y) {
		this.parent(x,y);
	},

	draw: function(context, x, y) {
		game.font.draw(context, "LEFT: "+game.zfill(this.value,4), this.pos.x+x, this.pos.y+y);
	}
});