 // Create the state that will contain the whole game
var mainState = {  
    preload: function() {  
        // Here we preload the assets
    },

    create: function() {  
        // Here we create the game
        // Set the background color to blue
        game.stage.backgroundColor = '#3598db';
        
        // Start the Arcade physics system (for movements and collisions)
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
        // Add the physics engine to all the game objetcs
        game.world.enableBody = true;
    },

    update: function() {  
        // Here we update the game 60 times per second
    },
};

// Initialize the game and start our state
var game = new Phaser.Game(400, 450);  
game.state.add('main', mainState);  
game.state.start('main');