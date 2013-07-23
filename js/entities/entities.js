game.PlayerEntity = me.AnimationSheet.extend({

	// boolean, can the player currently move?
	// disabled when animating or already moving
	init: function(x, y) {
		this.gridPos = {
			x: x,
			y: y
		}
        // call the constructor
        this.parent((x+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, (y+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE, me.loader.getImage('player'), 16, 16);
        
        this.setupAnimations();

		// set the default horizontal & vertical speed (accel vector)
        this.anchorPoint.set(0.5,0.5);

        this.hp = 20;
        this.mood = 0; // TODO?
        this.scans = 3;
        this.stamina = {
        	current: 20,
        	death: -20,
        	max: 20,
        	regen: 30, // in ticks/frames
        	regen2: 180, // fastest regen
        	regenTicks: 180
        }

        this.scanCount = 0;

        this.canInput = true;

        // set the display to follow our position on both axis
        //me.game.viewport.follow(this.pos, me.game.viewport.AXIS.BOTH);
    },

    setupAnimations: function() {
    	this.addAnimation("walk_down" ,[0,1,2,3],10);
    	this.addAnimation("walk_up"   ,[4,5,6,7],10);
    	this.addAnimation("walk_right",[8,9,10,11],10);
    	this.addAnimation("walk_left" ,[12,13,14,15],10);
    	// default animation state
    	this.setCurrentAnimation("walk_down");
    },

    doMove: function(dx,dy) {
    	this.canInput = false;
    	var nextObj = null;
    	var scan = null, dust = null;
    	var egrid = game.map.entityGrid[dx][dy];
    	if (dx > -1 && dx < game.map.gridWidth && dy > -1 && dy < game.map.gridHeight) {
    		nextObj = egrid.pop();
    	}
    	/*
    	if (nextObj.className == 'dust') {
    		// ignore dust, put it back in the list at the start
    		game.map.entityGrid[dx][dy].unshift(nextObj);
    		if (egrid.length > 1) {
    			// something else there
    			nextObj = game.map.entityGrid[dx][dy].pop();
    		} else {
    			nextObj = null; // nothing but dust, move normally
    		}
    	}
    	*/
    	if (!nextObj || nextObj.className == 'dust') {
    		// start moving
    		this.gridPos.x = dx;
    		this.gridPos.y = dy;
    		var tween = new me.Tween(this.pos).to({x: (dx+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, y: (dy+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE}, 200)
    			.onComplete(this.moveDone.bind(this,0));
    		tween.easing(me.Tween.Easing.Quadratic.EaseInOut);
    		tween.start();
    	} else {
    		// something is in the way, either dig it or
    		// give invalidKey feedback
    		 
    		if (nextObj.className == 'scanresult' || nextObj.className == 'scanfail') {
    			// save the scanresult and replace it with whatever it was on top of
    			scan = nextObj;
    			nextObj = game.map.entityGrid[dx][dy].pop();
    		}


    		if (nextObj && nextObj.className != 'gem' && this.stamina.current <= 0) {
	    		// no energy to dig/activate something
	    		// TODO - animation and/or sound
	    		game.map.entityGrid[dx][dy].push(nextObj);
	    		if (scan) {
	    			game.map.entityGrid[dx][dy].push(scan);
	    		}
	    		this.canInput = true;
	    		return;
    		}
    		
    		// attempt to dig / activate
    		if (nextObj && nextObj.touch(this)) {
    			//console.log('touch is true',nextObj,scan);
    			// if true, then add it back to the array
    			game.map.entityGrid[dx][dy].push(nextObj);
    			if (scan) {
    				game.map.entityGrid[dx][dy].push(scan);
    			}
    		} else {
    			//console.log('touch is false',nextObj,scan);
    			// we dug it, remove scan result if nothing else is there
    			if (scan && game.map.entityGrid[dx][dy].length > 0 && game.map.entityGrid[dx][dy][0].className != 'dust') {
    				// something is there, put it back
    				scan.poke(); // change to less obtrusive sprite
    				game.map.entityGrid[dx][dy].push(scan);
    			} else if (scan) {
    				// remove the scan result
    				scan.touch();

    			}
    		}
    	}
    },

    moveDone: function(moveCost) {
    	//me.game.HUD.updateItemValue('moves',moveCost); // caller determines move cost
    	if (moveCost > 0) {
    		this.stamina.regenTicks = 0;	
    		this.stamina.current -= moveCost;
    	}
    	this.canInput = true;
    },

    scanDone: function() {
    	this.scanCount-=1;
    	console.log(this.scanCount);
    	if (this.scanCount <= 0) {
    		this.canInput = true;
    	}
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
	    		this.setCurrentAnimation("walk_left");
	    		if (this.gridPos.x > 0) {
	    			this.doMove(this.gridPos.x-1,this.gridPos.y);
	    		}
	    	} else if (me.input.isKeyPressed('right')) {
	    		this.setCurrentAnimation("walk_right");
	    		if (this.gridPos.x < game.map.gridWidth-1) {
	    			this.doMove(this.gridPos.x+1,this.gridPos.y);	
	    		}
	    	} else if (me.input.isKeyPressed('up')) {
	    		this.setCurrentAnimation("walk_up");
	    		if (this.gridPos.y > 0) {
	    			this.doMove(this.gridPos.x,this.gridPos.y-1);
	    		}
	    	} else if (me.input.isKeyPressed('down')) {
	    		this.setCurrentAnimation("walk_down");
	    		if (this.gridPos.y < game.map.gridHeight-1) {
	    			this.doMove(this.gridPos.x,this.gridPos.y+1);
	    		}
	    	} else if (me.input.isKeyPressed('space') && this.scans > 0 && this.scanCount == 0) {
	    		// normally, do an animation.
	    		this.scanCount = 0;
	    		this.scans -= 1;
	    		var scanObj;
	    		if (this.gridPos.x > 0) {
	    			this.scanCount+=1;
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x-1,this.gridPos.y,0,this);
	    			me.game.add(scanObj,80);
	    		}
	    		if (this.gridPos.x < game.map.gridWidth-1) {
	    			this.scanCount+=1;
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x+1,this.gridPos.y,1,this);
	    			me.game.add(scanObj,80);
	    		}
	    		if (this.gridPos.y > 0) {
	    			this.scanCount+=1;
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x,this.gridPos.y-1,2,this);
	    			me.game.add(scanObj,80);
	    		}
	    		if (this.gridPos.y < game.map.gridHeight-1) {
	    			this.scanCount+=1;
	    			scanObj = me.entityPool.newInstanceOf('scanner',this.gridPos.x,this.gridPos.y+1,3,this);
	    			me.game.add(scanObj,80);
	    		}
	    		this.canInput = false;
	    		// don't allow input until scan is done
	    		me.game.sort();
	    	} else if (me.input.isKeyPressed('n')) {
	    		console.log('skipping level '+game.levelNum);
	    		me.levelDirector.reloadLevel();
	    	}
    	}
    	// stamina death
    	if (this.stamina.current < this.stamina.death) {
    		// TODO: animation goes here
    		// restart this levle number
    		game.levelNum-=1;
    		// todo: reuse same map
    		me.levelDirector.reloadLevel();
    	}

    	// stamina regen
    	if (this.stamina.regenTicks < this.stamina.regen) {
    		// recently dug, reduced regen
    		this.stamina.current += 0.017;
    		this.stamina.regenTicks += me.timer.tick;
    	} else if (this.stamina.regenTicks < this.stamina.regen2) {
    		// first regen tier
    		this.stamina.current += 0.03;
    		this.stamina.regenTicks += me.timer.tick;
    	} else {
    		this.stamina.current += 0.09;
    	}
    	
    	if (this.stamina.current > this.stamina.max) {
    		this.stamina.current = this.stamina.max;
    	}
    	me.game.HUD.setItemValue('stamina',this.stamina);
		//this.updateMovement();

    	this.parent();
    	return true;
    }

});

game.boxmuller = function() {
	/*
	var x = 0, y = 0, r, c;
	do {
		x = Math.random()*2-1;
		y = Math.random()*2-1;
		r = x*x + y*y;
	} while (r == 0 || r > 1)

	c = Math.sqrt(-2*Math.log(r)/r);

	return [x*c, y*c];
	*/

	var x = Math.random();
	var y = Math.random()*2*Math.PI;
	var r = Math.sqrt(-2*Math.log(x));
	return [r*Math.cos(y),r*Math.sin(y)];
}

game.rand_dist = function(mu0, sigma0, mu1, sigma1) {
	// generate numbers from a normal distribution
	var std = game.boxmuller();
	//console.log(std);
	std[0] = Math.round(std[0]*sigma0+mu0);
	std[1] = Math.round(std[1]*sigma1+mu1);
	return std;
}

game.euclid_dist = function(w,h) {
	return [Math.floor(Math.random()*w),Math.floor(Math.random()*h)]
}

// static hash of grid spaces
game.GRID = {
	ORIGIN: {
		X: 2,
		Y: 2
	},
	TILE_SIZE: 16,
	
	DIRT_EMPTY: 1,
	DIRT2_EMPTY: 2,
	DIRT3_EMPTY: 3,
	DIRT4_EMPTY: 4,

	ADD_GEM: 30,
	DIRT_GEM: 31,
	DIRT2_GEM: 32,
	DIRT3_GEM: 33,
	DIRT4_GEM: 34,
	NOTHING: 1000,
	HOIST: 1001
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
game.MapHandler.prototype.generateMap = function(w,h,levelNum) {
	// calculate some constants based on levleNum
	this.levelNum = levelNum;
	this.dustChance = 1/(1 + Math.exp((levelNum-75.0)/-30.0));
	this.dustSpread = Math.floor(baseLog(2,levelNum))+1;
	//console.log('dust chance: '+this.dustChance);
	//console.log('dust spread: '+this.dustSpread);
	//var diffFactor = Math.pow(1.613,levelNum*0.5);
	//var diffFactor = Math.pow(1.02,levelNum);
	var diffFactor = baseLog(4,levelNum);
	this.diffFactor = diffFactor;
	//console.log('diffFactor: '+diffFactor);
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
	var gemCount = Math.floor((w+h)/2+Math.min(w,h));
	//var dirt2Count = Math.floor(Math.min(w*h*3,w*h*baseLog(0.75*levelNum)); // go for it
	var dirt2Count = Math.floor(w*h*Math.min(2.56,diffFactor)); // go for it
	
	// set counters
	this.dirtLeft = w*h; // will change if we have non-dirt spaces
	this.gemsLeft = gemCount;

	// set std distribution values
	// 95% of values will lie on grid
	var wMu = (w-1)/2;
	var wSigma = (wMu)*0.75;
	var hMu = (h-1)/2;
	var hSigma = (hMu)*0.75;

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
	me.game.add(game.player1,50);

	// TODO - abstract these loops
	while (dirt2Count > 0) {
		// TODO - generate different kinds of gems?
		//var coords = game.rand_dist(wMu, wSigma, hMu, hSigma); // Array(2) of random std dist
		var coords = game.euclid_dist(w,h); // just independent randoms
		//console.log(coords);
		// throw out anything that's out of bounds
		if (coords[0] < 0 || coords[0] >= w || coords[1] < 0 || coords[1] >= h) {

		} else if (this.grid[coords[0]][coords[1]] < game.GRID.DIRT4_EMPTY) {
			// if a gem is in this spot, cover it
			this.grid[coords[0]][coords[1]]++; // add one level of dirt
		}
		// else space is taken already, continue.

		// decrement anyway
		dirt2Count--;
	}

	while (gemCount > 0) {
		// TODO - generate different kinds of gems?
		//var coords = game.rand_dist(wMu, wSigma, hMu, hSigma); // Array(2) of random std dist
		var coords = game.euclid_dist(w,h); // just independent randoms
		//console.log(coords);
		// throw out anything that's out of bounds
		if (coords[0] < 0 || coords[0] >= w || coords[1] < 0 || coords[1] >= h) {
			this.gemsLeft -= 1;
		} else if (this.grid[coords[0]][coords[1]] >= game.GRID.DIRT_GEM) {
			// already put something here
			this.gemsLeft -= 1;
		} else {
			this.grid[coords[0]][coords[1]] += game.GRID.ADD_GEM;	
		}
		gemCount--;
	}
	// update the HUD
	me.game.HUD.setItemValue('gems', this.gemsLeft);
}
game.MapHandler.prototype.populateLevel = function() {
	console.log(this.gridWidth,this.gridHeight,this.diffFactor);
	for (var i = 0; i < this.gridWidth; i++) {
		var x = (game.GRID.ORIGIN.X + i)*game.GRID.TILE_SIZE;
		for (var j = 0; j < this.gridHeight; j++) {
			var y = (game.GRID.ORIGIN.Y + j)*game.GRID.TILE_SIZE;
			var cGrid = this.grid[i][j];
			if (cGrid >= game.GRID.DIRT_EMPTY && cGrid <= game.GRID.DIRT4_EMPTY) {
				//console.log(cGrid);
				var dirt = me.entityPool.newInstanceOf("dirt",x,y,cGrid);
				dirt.hasDust = Math.random() < this.dustChance;
				me.game.add(dirt,40);
				this.entityGrid[i][j] = [dirt];
			} else if (cGrid >= game.GRID.DIRT_GEM && cGrid <= game.GRID.DIRT4_GEM) {
				//console.log(cGrid);
				var dirt = me.entityPool.newInstanceOf("dirt",x,y,cGrid-game.GRID.ADD_GEM);
				dirt.hasDust = Math.random() < this.dustChance;
				var gem = me.entityPool.newInstanceOf('gem',x,y);
				me.game.add(gem,30);
				me.game.add(dirt,40);
				this.entityGrid[i][j] = [gem,dirt];
			} else if (cGrid == game.GRID.HOIST) {
				var hoist = me.entityPool.newInstanceOf('hoist',x,y);
				me.game.add(hoist,40);
				this.entityGrid[i][j] = [hoist];
			} else {
				//	case game.GRID.NOTHING:
				this.entityGrid[i][j] = [];
			}
		}
	}
	me.game.sort();
}

game.debugDraw = false;
game.nextGemId = 0;
game.GemEntity = me.SpriteObject.extend({
	
	init: function(x, y) {
		this.parent(x, y, me.loader.getImage("gem"));
		this.anchorPoint.set(0.5,0.5);
		this.name = 'gem'+(++game.nextGemId);
		// entity that is picking us up
		this.toucher = null;
		this.gemValue = 1;
		//this.digs = 1;
		//this.maxDigs = 1;
		me.input.registerPointerEvent('mousedown', this, this.onClick.bind(this));
	},

	onClick: function() {
		console.log(this.name);
	},

	touch: function(from) {
		// sanity check
		if (!this.toucher) {
			// notate who removed this object
			this.toucher = from;
			this.z = 100;
			
			me.game.HUD.updateItemValue('gems',-this.gemValue);
			if (me.game.HUD.getItemValue('gems') == 0) {
				game.theHoist.setCurrentAnimation('flash');
			}

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
		this.toucher.moveDone(0);
	},

	afterTween: function() {
		// notify toucher that we're done animating
		me.game.remove(this);
	},

	update: function() {
		this.parent();
		return true;
	},

	draw: function(ctx,x,y) {
		if (game.debugDraw) {
			console.log(this.name+ ' is drawing');
		}
		this.parent(ctx,x,y);
	}
});

debugGems = function() {
	return me.game.getEntityByName('gem');
};

game.DirtEntity = me.SpriteObject.extend({

	init: function(x, y, digs) {
		this.parent(x, y, me.loader.getImage("dirt"+digs));
		this.anchorPoint.set(0.5,0.5);
		//this.setOpacity(0.4);

		// entity that is digging us
		this.toucher = null;

		// number of digs required to get rid of this
		this.digs = digs;
		this.maxDigs = digs;
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
			// based on levelNum, chance to spawn dust
			// (x-50)/-33
			// use sigmoid function
			// see generateMap for defn
			if (this.hasDust) {
				console.log(game.map.dustSpread);
				var d = me.entityPool.newInstanceOf('dust',this.pos.x,this.pos.y, game.map.dustSpread);
				//d.addToGrid();
				me.game.add(d, 51); // above player
			}
			me.game.sort();
		} else {
			this.scaleFlag = false;
			//console.log(this.image,me.loader.getImage('dirt1'));
			this.image = me.loader.getImage("dirt"+this.digs);
		}
		this.toucher.moveDone(this.digs*0.5+1);
		this.toucher = null;
	},

	update: function() {
		this.parent();
		return true;
	}
});


game.theHoist = null;
game.HoistEntity = me.AnimationSheet.extend({
	
	init: function(x, y) {
		this.parent(x, y, me.loader.getImage("hoist"), 16, 16);
		this.anchorPoint.set(0.5,0.5);
		game.theHoist = this;
		this.setupAnimations();
	},

	setupAnimations: function() {
    	this.addAnimation("idle",[0]);
    	this.addAnimation("flash",[1,1,1,0],15);
    	// default animation state
    	this.setCurrentAnimation("idle");
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
		this.energy = Math.max(game.map.gridWidth,game.map.gridHeight);
		this.walkDir = dir;
		//this.walkEnergy = 2; // when does it stop moving in one direction?
		this.nextScan(); // start scanning
	},

	nextScan: function() {
		// remove object if out of energy
		if (this.energy <= 0) {
			//this.visible = false;
			this.toucher.scanDone();
			me.game.remove(this);
			return;
		}

		this.energy--;
		// do things in current cell before moving
		
		// scan current tile, get total cost + find out if we need to create a result
		var egrid = game.map.entityGrid[this.gridPos.x][this.gridPos.y];
		var cost = 0, found = false, scanned = false;
		for (var i = 0, ii = egrid.length; i < ii; i++) {
			//console.log(egrid[i]);
			//if (egrid[i].digs) {
			//	cost += egrid[i].digs;
			//}
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
				this.energy -= 1; // only reduce energy when we find something
			} else if (egrid.length > 0 && egrid[0].className != 'dust') {
				scanResult = me.entityPool.newInstanceOf('scanfail',this.pos.x,this.pos.y);
			}
			if (scanResult) {
				me.game.add(scanResult,90);
				egrid.push(scanResult);
				me.game.sort();
			}
		}
		
		switch(this.walkDir) {
			case 0:
				if (this.gridPos.x > 0) {
					this.gridPos.x--;
				} else {
					this.energy = 0;
				}
				break;
			case 1:
				if (this.gridPos.x < game.map.gridWidth-1) {
					this.gridPos.x++;
				} else {
					this.energy = 0;
				}
				break;
			case 2:
				if (this.gridPos.y > 0) {
					this.gridPos.y--;
				} else {
					this.energy = 0;
				}
				break;
			case 3:
				if (this.gridPos.y < game.map.gridHeight-1) {
					this.gridPos.y++;
				} else {
					this.energy = 0;
				}
				break;
		}
		
		// animate with tween
		// Scanner Tween
		var tween = new me.Tween(this.pos).to({x: (this.gridPos.x+game.GRID.ORIGIN.X)*game.GRID.TILE_SIZE, y: (this.gridPos.y+game.GRID.ORIGIN.Y)*game.GRID.TILE_SIZE}, 200)
    			.onComplete(this.nextScan.bind(this));
		tween.easing(me.Tween.Easing.Cubic.EaseInOut);
		tween.start();
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
// Enemy Entities
//
game.DustEntity = me.SpriteObject.extend({
	init: function(x, y, spread) {
		this.gridPos = {
			x: (x/game.GRID.TILE_SIZE)-game.GRID.ORIGIN.X,
			y: (y/game.GRID.TILE_SIZE)-game.GRID.ORIGIN.Y
		}
		this.parent(x,y,me.loader.getImage("dust"));
		this.anchorPoint.set(0.5,0.5);
		this.lifespan = 720; // 12s
		this.choke = 0.5;

		// add to entity grid

		console.log(this.gridPos,spread);
		game.map.entityGrid[this.gridPos.x][this.gridPos.y].unshift(this);
		this.scale.set(2.0,2.0)
		this.scaleFlag = true;
		var chokeTween = new me.Tween(this).to({choke: 1.0},1000-spread*100);
		var firstTween = new me.Tween(this.scale).to({x: 1.0, y: 1.0}, 1000-spread*100).onComplete(this.spread.bind(this,spread));
		firstTween.easing(me.Tween.Easing.Exponential.EaseIn);
		firstTween.start();
		chokeTween.easing(me.Tween.Easing.Exponential.EaseIn);
		chokeTween.start();
	},

	spread: function(spread) {
		this.choke = 1;
		var x = this.pos.x;
		var y = this.pos.y;
		console.log('called spread');
		var eGrid = game.map.entityGrid;
		var g = null;
		var d = null;
		if (spread > 0) {
			// spread to nearby empty spaces
			if (this.gridPos.x > 0) {
				g = eGrid[this.gridPos.x-1][this.gridPos.y];
				//if (g.length == 0 || g[0].className == 'gem') { // TODO: adjust this logic?
				if (g.length == 0) {
					d = me.entityPool.newInstanceOf('dust',x-game.GRID.TILE_SIZE,y,spread-1);
					me.game.add(d,51);
				}	
			}
			if (this.gridPos.x < game.map.gridWidth-1) {
				g = eGrid[this.gridPos.x+1][this.gridPos.y];
				//if (g.length == 0 || g[0].className == 'gem') {
				if (g.length == 0) {
					d = me.entityPool.newInstanceOf('dust',x+game.GRID.TILE_SIZE,y,spread-1);
					me.game.add(d,51);
				}	
			}
			if (this.gridPos.y > 0) {
				g = eGrid[this.gridPos.x][this.gridPos.y-1];
				//if (g.length == 0 || g[0].className == 'gem') {
				if (g.length == 0) {
					d = me.entityPool.newInstanceOf('dust',x,y-game.GRID.TILE_SIZE,spread-1);
					me.game.add(d,51);
				}	
			}
			if (this.gridPos.y < game.map.gridHeight-1) {
				g = eGrid[this.gridPos.x][this.gridPos.y+1];
				//if (g.length == 0 || g[0].className == 'gem') {
				if (g.length == 0) {
					d = me.entityPool.newInstanceOf('dust',x,y+game.GRID.TILE_SIZE,spread-1);
					me.game.add(d,51);
				}	
			}
			// make sure everything gets drawn
			me.game.sort();
		} else {
			// ??
			
		}
	},

	afterTween: function() {
		game.map.entityGrid[this.gridPos.x][this.gridPos.y].shift();
		me.game.remove(this);
	},

	update: function() {

		// remove when lifespan is up
		this.lifespan -= me.timer.tick;
		if (this.choke) {
			if (this.lifespan <= 0 && this.choke == 1)  {
				this.choke = 0.99;
				var firstTween = new me.Tween(this).to({choke: 0.0, alpha: 0.0}, 1000).onComplete(this.afterTween.bind(this));
				firstTween.easing(me.Tween.Easing.Exponential.EaseOut);
				firstTween.start();
				return;
			}
			// reduce player stamina if touching
			if (this.overlaps(game.player1)) {
				game.player1.stamina.regenTicks = 0; // disable fast regen
				game.player1.stamina.current -= this.choke*0.075;
			}
		}
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
		// draw bar outline
		x += this.pos.x;
		y += this.pos.y;
		context.strokeStyle = "white";
		context.strokeRect(x, y, 200, 32);
		if (this.value.current >= 0) {
			context.fillStyle = this.value.regenTicks < this.value.regen ? "#008800" : (this.value.regenTicks < this.value.regen2 ? "#00bb00" : "#44bb44");
			context.fillRect(x, y, this.value.current*10, 32);
		} else {
			context.fillStyle = this.value.regenTicks < this.value.regen ? "#880000" : (this.value.regenTicks < this.value.regen2 ? "#bb0000" : "#bb4444");
			context.fillRect(x, y, this.value.current*-10, 32);
		}
		
		//game.font.draw(context, "MOVES: "+game.zfill(this.value,4), this.pos.x+x, this.pos.y+y);
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