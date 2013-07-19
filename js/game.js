
/* Game namespace */
var game = {
    // Run on page load.
    "onload" : function () {
        // Initialize the video.
        if (!me.video.init("screen", 640, 480, true, 'auto')) {
            alert("Your browser does not support HTML5 canvas.");
            return;
        }
		
		// add "#debug" to the URL to enable the debug Panel
		if (document.location.hash === "#debug") {
			window.onReady(function () {
				me.plugin.register.defer(debugPanel, "debug");
			});
		}

        // Initialize the audio.
        me.audio.init("mp3,ogg");
        game.levelNum = 0;
        // generate test level on load
        me.game.onLevelLoaded = function(levelId) {
            game.levelNum++;
            game.map.generateMap(16,16,Math.pow(1.613,game.levelNum*0.5));
            //game.player1 = me.game.add(new game.PlayerEntity(64,64),0);
            game.map.populateLevel();
            me.game.add(new me.ImageLayer('bkg0',640,480,'bkg0',0),2);
            me.game.sort();
            me.game.repaint();
        }

        // setup the game font
        game.font = new me.Font("Iceberg", 32, "#ffffff");

        // Set a callback to run when loading is complete.
        me.loader.onload = this.loaded.bind(this);
     
        // Load the resources.
        me.loader.preload(game.resources);

        // Initialize melonJS and display a loading screen.
        me.state.change(me.state.LOADING);
    },



    // Run on game resources loaded.
    "loaded" : function () {
        me.sys.gravity = 0;
        me.state.set(me.state.MENU, new game.TitleScreen());
        me.state.set(me.state.PLAY, new game.PlayScreen());

        // Attach input handling
        me.input.bindKey(me.input.KEY.LEFT, "left", true);
        me.input.bindKey(me.input.KEY.RIGHT, "right", true);
        me.input.bindKey(me.input.KEY.UP, "up", true);
        me.input.bindKey(me.input.KEY.DOWN, "down", true);
        me.input.bindKey(me.input.KEY.SPACE, "space", true);

         // create the MapHandler instance
        game.map = new game.MapHandler();

        // add entities to pool

        // player
        me.entityPool.add('player',game.PlayerEntity,true);

        // player scan
        me.entityPool.add("scanner",game.ScanEntity,true);
        me.entityPool.add("scanresult",game.ScanResult,true);
        me.entityPool.add("scanfail",game.FailResult,true);

        // map tiles
        me.entityPool.add("dirt",game.DirtEntity,true);
        me.entityPool.add("dirt2",game.Dirt2Entity,true);
        me.entityPool.add('gem',game.GemEntity,true);
        me.entityPool.add('hoist',game.HoistEntity,true);

        me.game.addHUD(0,0,640,96);
        me.game.HUD.addItem('moves', new game.MoveCounter(0,32));
        me.game.HUD.addItem('gems', new game.GemCounter(34,64));

        // Start the game.
        me.state.change(me.state.PLAY);
    }
};
