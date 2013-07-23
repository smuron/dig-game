game.PlayScreen = me.ScreenObject.extend({
	/**	
	 *  action to perform on state change
	 */
	onResetEvent: function() {	
		Math.seedrandom("SAGoonDev2013_Raelus",false);
      me.levelDirector.loadLevel('dummy');
      game.digCount = 0;

	},
	
	
	/**	
	 *  action to perform when leaving this screen (state change)
	 */
	onDestroyEvent: function() {
	  ; // TODO
	}
});
