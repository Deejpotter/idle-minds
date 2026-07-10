import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import GuildScene from './scenes/GuildScene.js';
import DungeonSelectScene from './scenes/DungeonSelectScene.js';
import DungeonScene from './scenes/DungeonScene.js';

const config = {
    type: Phaser.CANVAS,
    width: 800,
    height: 600,
    pixelArt: true,
    backgroundColor: '#08060f',
    parent: 'game-container',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: [BootScene, TitleScene, GuildScene, DungeonSelectScene, DungeonScene]
};

window.__PHASER_GAME__ = new Phaser.Game(config);
