class Scene2 extends Phaser.Scene {
    constructor(){
        super("playGame"); //playgame = identifiant pour la scene
    }


    create() {
        this.background = this.add.tileSprite(0, 0, config.width, config.height, "background");
        this.background.setOrigin(0,0);

        /* score */

        var graphics = this.add.graphics();
        // add shape noire
        graphics.fillStyle(0x000000, 1);
        // draw the polygon
        graphics.fillRect(0,0,config.width,20);


        this.score = 0;
        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel = this.add.bitmapText(10, 5, "pixelFont", "SCORE " + scoreFormated, 16);

        /* ship */

        this.ship = this.add.sprite(config.width/2 - 50, config.height/2, "ship");
        this.ship2 = this.add.sprite(config.width/2, config.height/2, "ship2");
        this.ship3 = this.add.sprite(config.width/2 + 50, config.height/2,"ship3");

        this.ship.play("ship1_anim");
        this.ship2.play("ship2_anim");
        this.ship3.play("ship3_anim");

        this.ship.setInteractive();
        this.ship2.setInteractive();
        this.ship3.setInteractive();

        this.enemies = this.physics.add.group();
        this.enemies.add(this.ship);
        this.enemies.add(this.ship2);
        this.enemies.add(this.ship3);

        this.input.on('gameobjectdown', this.destroyShip, this);

       // this.add.text(20, 20, "Playing game...", {font: "25px Arial", fill: "yellow"});


        /* Power up */

        this.powerUps = this.physics.add.group();

        var maxObjects = 4;
        for(var i = 0; i <= maxObjects; i++){
            var powerUp = this.physics.add.sprite(16, 16, "power-up");
            this.powerUps.add(powerUp);
            powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

            if(Math.random() > 0.5){
                powerUp.play("red");
            } else {
                powerUp.play("gray");
            }

            powerUp.setVelocity(100, 100);
            powerUp.setCollideWorldBounds(true);
            powerUp.setBounce(1);
        }

        /* Player */

        this.player = this.physics.add.sprite(config.width/2 - 8, config.height - 64, "player");
        this.player.play("thrust");
        this.cursorKeys = this.input.keyboard.createCursorKeys();
        this.player.setCollideWorldBounds(true);

        /* beam */

        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.projectiles = this.add.group();
        
        this.physics.add.collider(this.projectiles, this.powerUps, function(projectile, powerUp){
            projectile.destroy();
        });

        // overlap pour pas que ca rebondisse comme collider
        // power-up vs player
        this.physics.add.overlap(this.player, this.powerUps, this.pickPowerUp, null, this);
        // ship vs player
        this.physics.add.overlap(this.player, this.enemies, this.hurtPlayer, null, this);
        // shoot vs ship
        this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
    }

    update(){
        this.moveShip(this.ship, 1);
        this.moveShip(this.ship2, 1);
        this.moveShip(this.ship3, 1);

        this.background.tilePositionY -= 0.5;
        this.movePlayerManager();

        if(Phaser.Input.Keyboard.JustDown(this.spaceBar)){
            if(this.player.active){
                this.shootBeam();
            }
        }

        for(var i = 0; i < this.projectiles.getChildren().length; i++){
            var beam = this.projectiles.getChildren()[i];
            beam.update();
        }
    }


    // function affichage score
    zeroPad(number, size){
        var stringNumber = String(number);
        while(stringNumber.length < (size || 2)){
            stringNumber = "0" + stringNumber;
        }
        return stringNumber;
    }

    hitEnemy(projectile, enemy){

        var explosion = new Explosion(this, enemy.x, enemy.y);

        projectile.destroy();
        this.resetShipPos(enemy);
        this.score += 15;
        var scoreFormated = this.zeroPad(this.score, 6);
        this.scoreLabel.text = "SCORE " + scoreFormated;
    }

    hurtPlayer(player, enemy){
        this.resetShipPos(enemy);
        
        if(this.player.alpha < 1){
            return;
        }
        var explosion = new Explosion(this, player.x, player.y);
        //sans ça il apparait encore
        player.disableBody(true, true);
        if(this.score > 0){
            this.score -= 15;
            var scoreFormated = this.zeroPad(this.score, 6);
            this.scoreLabel.text = "SCORE " + scoreFormated;
        } else {
            this.score = 0;
            var scoreFormated = this.zeroPad(this.score, 6);
            this.scoreLabel.text = "SCORE " + scoreFormated;
        }

        // Timer avant de réapparaitre
        this.time.addEvent({
            delay: 1000,
            callback: this.resetPlayer,
            callbackScope: this,
            loop: false
        })
    }

    resetPlayer(){
        var x = config.width/2 - 8;
        var y = config.height + 64;
        this.player.enableBody(true, x, y, true, true);

        // player transparent
        this.player.alpha = 0.5;

        var tween = this.tweens.add({
            targets: this.player,
            y: config.height - 64,
            ease: 'Power1',
            duration: 1500,
            repeat: 0,
            onComplete: function(){
                this.player.alpha = 1;
            },
            callbackScope: this
        });
    }

    pickPowerUp(player, powerUp){
        // inactive et hide from display list
        powerUp.disableBody(true, true);
    }

    shootBeam(){
        var beam = new Beam(this);
    }

    movePlayerManager(){
        if(this.cursorKeys.left.isDown){
            this.player.setVelocityX(-gameSettings.playerSpeed);
        } else if(this.cursorKeys.right.isDown){
            this.player.setVelocityX(gameSettings.playerSpeed);
        } else if(this.cursorKeys.down.isDown){
            this.player.setVelocityY(gameSettings.playerSpeed);
        } else if(this.cursorKeys.up.isDown){
            this.player.setVelocityY(-gameSettings.playerSpeed);
        } else {
            this.player.setVelocityX(0);
            this.player.setVelocityY(0);
        }
    }

    moveShip(ship, speed){
        ship.y += speed;
        if (ship.y > config.height){
            this.resetShipPos(ship);
        }
    }

    resetShipPos(ship){
        // ship at position 0 y axis
        ship.y = 0;
        // Position X random
        var randomX = Phaser.Math.Between(0, config.width);
        ship.x = randomX;
    }

    destroyShip(pointer, gameObject){
        // switch ship -> explosion sheet
        gameObject.setTexture("explode");
        gameObject.play("explode")
    }

}